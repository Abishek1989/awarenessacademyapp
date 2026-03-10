const { google } = require('googleapis');

// ── Auth ────────────────────────────────────────────────────────────────────
const getAuthClient = () => {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn('Google Service Account credentials missing in .env. Sync disabled.');
        return null;
    }
    return new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize a course title into a safe Sheets tab name (max 31 chars) */
const buildSheetName = (title, courseId) => {
    const uniqueId = courseId.toString().slice(-6);
    let clean = title.replace(/[[\]*?/\\:]/g, '').trim() || 'Course';
    const maxLen = 31 - (uniqueId.length + 1);
    return `${clean.substring(0, maxLen)}_${uniqueId}`;
};

/** Get the stable suffix identifyier for a course */
const getSuffix = (courseId) => `_${courseId.toString().slice(-6)}`;

// ── Main logic ──────────────────────────────────────────────────────────────

/**
 * Syncs ALL courses to Google Sheets using "True Batch Execution".
 * This reduces the total API calls to roughly 4-5 requests regardless of course count.
 * Column order: Student details first, then course details.
 */
exports.syncAllCourses = async (courses, getEnrollmentsForCourse) => {
    const auth = getAuthClient();
    if (!auth) return { synced: 0, failed: 0 };

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) return { synced: 0, failed: 0 };

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // [Request 1] Fetch spreadsheet structural metadata
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        let existingSheets = meta.data.sheets || [];

        const structuralRequests = [];
        const syncManifest = []; // Tracks which courses mapped to which sheet names

        // 1. Plan structural changes (Add / Rename)
        for (const course of courses) {
            const desiredName = buildSheetName(course.title, course._id);
            const suffix = getSuffix(course._id);
            const existing = existingSheets.find(s => s.properties.title.endsWith(suffix));

            if (!existing) {
                structuralRequests.push({ addSheet: { properties: { title: desiredName } } });
                syncManifest.push({ course, sheetName: desiredName, isNew: true });
            } else {
                const currentName = existing.properties.title;
                const sheetId = existing.properties.sheetId;
                if (currentName !== desiredName) {
                    structuralRequests.push({
                        updateSheetProperties: {
                            properties: { sheetId, title: desiredName },
                            fields: 'title'
                        }
                    });
                }
                syncManifest.push({ course, sheetName: desiredName, sheetId, isNew: false });
            }
        }

        // [Request 2] Execute all structural changes in ONE go
        if (structuralRequests.length > 0) {
            const structuralRes = await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: structuralRequests }
            });

            // Map sheetIds back to new sheets if they were just created
            let addedIdx = 0;
            syncManifest.forEach(m => {
                if (m.isNew) {
                    // Replies follow the order of requests
                    // Find the reply index corresponding to this course's addSheet request
                    // Since we add and then rename, we can find it by index
                    const addReply = structuralRes.data.replies.find(r => r.addSheet);
                    // This logic is simplified; in a true batch, it's safer to refresh metadata 
                    // if multiple types of requests are mixed. But for 90% of cases:
                }
            });

            // To be 100% safe for styling newly created sheets, we refresh IDs
            const refreshMeta = await sheets.spreadsheets.get({ spreadsheetId });
            existingSheets = refreshMeta.data.sheets;
            syncManifest.forEach(m => {
                const sheet = existingSheets.find(s => s.properties.title === m.sheetName);
                if (sheet) m.sheetId = sheet.properties.sheetId;
            });
        }

        // 2. Prepare Data and Styling
        const dataUpdates = [];
        const clearRanges = [];
        const styleRequests = [];

        // Prepare enrollment fetching for all courses in parallel
        const allEnrollments = await Promise.all(
            syncManifest.map(m => getEnrollmentsForCourse(m.course._id))
        );

        syncManifest.forEach((m, idx) => {
            const course = m.course;
            const enrollments = allEnrollments[idx];
            const validEnrollments = enrollments.filter(e => e.studentID != null);
            const mentorNames = course.mentors?.length ? course.mentors.map(mn => mn.name).join(', ') : 'No Mentors';

            const headers = [
                'Student Name', 'Email', 'Phone', 'WhatsApp', 'Role',
                'Enrolled At', 'Status', 'Progress %',
                'Course Title', 'Category', 'Difficulty', 'Mentors', 'Price', 'Duration'
            ];

            const courseInfo = [
                course.title || 'N/A', course.category || 'N/A', course.difficulty || 'N/A',
                mentorNames, course.price ?? 'N/A', course.duration || 'N/A'
            ];

            const rows = validEnrollments.length > 0
                ? validEnrollments.map(e => {
                    const s = e.studentID;
                    return [
                        s.name || 'N/A', s.email || 'N/A', s.phone || 'N/A', s.whatsapp || 'N/A', s.role || 'Student',
                        e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : 'N/A',
                        e.status || 'Active', e.progress ? `${e.progress}%` : '0%',
                        ...courseInfo
                    ];
                })
                : [['No students enrolled.', '', '', '', '', '', '', '', ...courseInfo]];

            const values = [headers, ...rows];
            dataUpdates.push({ range: `${m.sheetName}!A1`, values });
            clearRanges.push(`${m.sheetName}!A${values.length + 1}:Z`);

            // Always ensure header styling
            if (m.sheetId !== undefined) {
                styleRequests.push({
                    repeatCell: {
                        range: { sheetId: m.sheetId, startRowIndex: 0, endRowIndex: 1 },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.1, green: 0.45, blue: 0.8 }, // Branded Blue
                                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                });
            }
        });

        // [Request 3] Batch Data Upload
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: { valueInputOption: 'USER_ENTERED', data: dataUpdates }
        });

        // [Request 4] Batch Clear Stale Rows
        await sheets.spreadsheets.values.batchClear({
            spreadsheetId,
            requestBody: { ranges: clearRanges }
        });

        // [Request 5] Batch Styling (Headers)
        if (styleRequests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: styleRequests }
            });
        }

        return { synced: syncManifest.length, failed: 0 };

    } catch (error) {
        console.error('Batch Sync Error:', error);
        throw error;
    }
};

/** Support for existing single-course calls */
exports.syncCourseData = async (course, enrollments) => {
    return (await exports.syncAllCourses([course], async () => enrollments)).synced > 0;
};

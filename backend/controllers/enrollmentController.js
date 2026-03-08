/**
 * Enrollment Controller
 * Handles course enrollment operations
 */

const { Enrollment, Course, User } = require('../models/index');

/**
 * Create a new enrollment
 * POST /api/enrollments
 */
exports.createEnrollment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.id;

        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            studentID: studentId,
            courseID: courseId,
            status: 'Active'
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrolled in this course' });
        }

        // Calculate Expiry Date
        let expiryDate = null;
        if (course.validityType === 'Limited' && course.validityDays > 0) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + course.validityDays);
        }

        // Create enrollment
        const enrollment = new Enrollment({
            studentID: studentId,
            courseID: courseId,
            enrolledAt: new Date(),
            expiryDate: expiryDate,
            status: 'Active',
            progress: 0,
            completed: false
        });

        await enrollment.save();

        // Update user's enrolledCourses array
        await User.findByIdAndUpdate(studentId, {
            $addToSet: { enrolledCourses: courseId }
        });

        res.status(201).json({
            message: 'Enrollment successful',
            enrollment
        });
    } catch (err) {
        console.error('Enrollment error:', err);
        res.status(500).json({ message: 'Enrollment failed', error: err.message });
    }
};

/**
 * Get current user's enrollments
 * GET /api/enrollments/my
 */
exports.getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.user.id;

        const enrollments = await Enrollment.find({ studentID: studentId })
            .populate('courseID', 'title thumbnail category introVideoUrl description price')
            .sort({ enrolledAt: -1 });

        res.status(200).json(enrollments);
    } catch (err) {
        console.error('Fetch enrollments error:', err);
        res.status(500).json({ message: 'Failed to fetch enrollments', error: err.message });
    }
};

/**
 * Check if user is enrolled in a specific course
 * GET /api/enrollments/check/:courseId
 */
exports.checkEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const enrollment = await Enrollment.findOne({
            studentID: studentId,
            courseID: courseId,
            status: 'Active'
        });

        res.status(200).json({
            enrolled: !!enrollment,
            enrollment: enrollment || null
        });
    } catch (err) {
        console.error('Check enrollment error:', err);
        res.status(500).json({ message: 'Failed to check enrollment', error: err.message });
    }
};

/**
 * Get all enrollments for a specific course (Admin/Staff only)
 * GET /api/enrollments/course/:courseId
 */
exports.getCourseEnrollments = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find all enrollments for this course
        const enrollments = await Enrollment.find({ courseID: courseId })
            .populate('studentID', 'name email mobile')
            .sort({ enrolledAt: -1 });

        // Count total lessons from the Module collection
        const ModuleModel = require('../models/Module');
        const { Progress, Certificate } = require('../models/index');

        let totalModules = 0;
        try {
            const modules = await ModuleModel.find({ courseId });
            totalModules = modules.reduce((sum, m) => sum + (m.items ? m.items.length : 0), 0);
        } catch (e) {
            // Fallback: totalModules stays 0, progress % will use percentComplete
        }

        // Fetch course validity details
        const course = await Course.findById(courseId).select('validityType validityDays');
        const courseValidityType = course?.validityType || 'Lifetime';
        const courseValidityDays = course?.validityDays || 0;

        const enrichedEnrollments = await Promise.all(enrollments.map(async (enr) => {
            const studentId = enr.studentID?._id;
            if (!studentId) return null;

            // Get progress
            const progress = await Progress.findOne({ studentID: studentId, courseID: courseId });
            const completedCount = progress ? (progress.moduleProgress || []).filter(m => m.completed).length : 0;
            const progressPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : (progress ? progress.percentComplete : 0);

            // Days info
            const now = new Date();
            const enrollDate = enr.enrolledAt ? new Date(enr.enrolledAt) : now;
            const daysCompleted = Math.floor((now - enrollDate) / (1000 * 60 * 60 * 24));

            let daysLeft = null;
            let isExpired = false;
            let effectiveExpiryDate = enr.expiryDate;

            // Self-healing for missing expiry dates on limited courses
            if (!effectiveExpiryDate && courseValidityType === 'Limited' && courseValidityDays > 0) {
                const calculatedExpiry = new Date(enrollDate);
                calculatedExpiry.setDate(calculatedExpiry.getDate() + courseValidityDays);
                effectiveExpiryDate = calculatedExpiry;

                // Fire-and-forget save back to DB to fix the data
                Enrollment.findByIdAndUpdate(enr._id, { expiryDate: effectiveExpiryDate }).exec().catch(e => console.error('Self-heal failed:', e));
            }

            if (effectiveExpiryDate) {
                const expiry = new Date(effectiveExpiryDate);
                daysLeft = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
                isExpired = now > expiry;
            }

            // Certificate check
            const cert = await Certificate.findOne({ studentID: studentId, courseID: courseId });

            return {
                _id: enr._id,
                student: enr.studentID,
                status: enr.status,
                enrollmentDate: enr.enrolledAt,
                expiryDate: effectiveExpiryDate,
                daysCompleted,
                daysLeft,
                isExpired,
                progressPct,
                completedItems: completedCount,
                totalItems: totalModules,
                certificateIssued: !!cert,
                courseValidityType,
                courseValidityDays
            };
        }));

        res.status(200).json(enrichedEnrollments.filter(Boolean));
    } catch (err) {
        console.error('Get course enrollments error:', err);
        res.status(500).json({ message: 'Failed to fetch course enrollments', error: err.message });
    }
};

/**
 * Update an enrollment (e.g., extend validity, disable access)
 * PUT /api/enrollments/:id
 */
exports.updateEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, expiryDate } = req.body;

        const enrollment = await Enrollment.findById(id);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // validate incoming status against the model enum to avoid mongoose errors
        const validStatuses = ['Active', 'Expired', 'Disabled', 'Completed'];
        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }
            enrollment.status = status;
        }

        if (expiryDate !== undefined) {
            if (expiryDate === null) {
                enrollment.expiryDate = null; // Lifetime access
            } else {
                enrollment.expiryDate = new Date(expiryDate);
            }
        }

        await enrollment.save();

        res.status(200).json({ message: 'Enrollment updated successfully', enrollment });
    } catch (err) {
        console.error('Update enrollment error:', err);
        res.status(500).json({ message: 'Failed to update enrollment', error: err.message });
    }
};

/**
 * Delete an enrollment completely
 * DELETE /api/enrollments/:id
 */
exports.deleteEnrollment = async (req, res) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findById(id);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Remove from the User's enrolledCourses array
        await User.findByIdAndUpdate(enrollment.studentID, {
            $pull: { enrolledCourses: enrollment.courseID }
        });

        // Delete the enrollment document
        await Enrollment.findByIdAndDelete(id);

        res.status(200).json({ message: 'Enrollment deleted successfully' });
    } catch (err) {
        console.error('Delete enrollment error:', err);
        res.status(500).json({ message: 'Failed to delete enrollment', error: err.message });
    }
};

/**
 * Module Manager
 * Manage course modules with drag-drop reordering and rich content editing
 */

let currentCourse = null;
let modules = [];
let editingModule = null;
let sortable = null;
let quillEditor = null;

// Local upload helpers and modal logic removed - now handled in moduleEditor.js

document.addEventListener('DOMContentLoaded', async () => {
    // Verify auth
    const authData = Auth.checkAuth(['Staff', 'Admin']);
    if (!authData) return;

    // Load courses
    await loadCourses();

    // Event listeners
    document.getElementById('courseSelect').addEventListener('change', handleCourseChange);
    document.getElementById('addModuleBtn').addEventListener('click', () => {
        if (!currentCourse) {
            UI.error('Please select a course first');
            return;
        }
        window.location.href = `module-editor.html?courseId=${currentCourse}`;
    });

    // Immediate check to hide dropdown if courseId is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('courseId')) {
        const courseSelectContainer = document.querySelector('.course-select');
        if (courseSelectContainer) {
            courseSelectContainer.style.display = 'none';
        }
    }
});



/**
 * Load courses for selection
 */
async function loadCourses() {
    try {
        const res = await fetch(`${Auth.apiBase}/staff/courses`, {
            headers: Auth.getHeaders()
        });

        if (!res.ok) {
            throw new Error('Failed to load courses');
        }

        // The response is an array directly, not { courses: [...] }
        const courses = await res.json();

        const select = document.getElementById('courseSelect');
        select.innerHTML = '<option value="">-- Select a course --</option>';

        if (!courses || courses.length === 0) {
            select.innerHTML += '<option value="" disabled>No courses available</option>';
            return;
        }

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = course.title;
            select.appendChild(option);
        });

        // Check URL parameters for courseId
        const urlParams = new URLSearchParams(window.location.search);
        const courseIdParam = urlParams.get('courseId');

        if (courseIdParam) {
            select.value = courseIdParam;
            // Only load if selection was successful (course exists in list)
            if (select.value === courseIdParam) {
                // Ensure it remains hidden
                const courseSelectContainer = document.querySelector('.course-select');
                if (courseSelectContainer) {
                    courseSelectContainer.style.display = 'none';
                }
                await handleCourseChange();
                return;
            } else {
                // Invalid course ID or not in list, show dropdown so user can pick
                const courseSelectContainer = document.querySelector('.course-select');
                if (courseSelectContainer) {
                    courseSelectContainer.style.display = 'block';
                }
                UI.error('Prescribed course not found. Please select from the list.');
            }
        } else {
            // No param, make sure it is visible
            const courseSelectContainer = document.querySelector('.course-select');
            if (courseSelectContainer) {
                courseSelectContainer.style.display = 'block';
            }
        }

        // Auto-select if only one course
        if (courses.length === 1) {
            select.value = courses[0]._id;
            await handleCourseChange();
        }

    } catch (err) {
        console.error('Failed to load courses:', err);
        const select = document.getElementById('courseSelect');
        select.innerHTML = '<option value="">Error loading courses - Check MongoDB connection</option>';
        UI.error('Failed to load courses. Please check if MongoDB is connected.');
    }
}

/**
 * Handle course selection change
 */
async function handleCourseChange() {
    const courseId = document.getElementById('courseSelect').value;

    if (!courseId) {
        currentCourse = null;
        modules = [];
        renderModules();
        return;
    }

    currentCourse = courseId;
    await loadModules(courseId);
}

/**
 * Load modules for selected course
 */
async function loadModules(courseId) {
    try {
        UI.showLoader();

        const res = await fetch(`${Auth.apiBase}/courses/${courseId}/modules?includeUnpublished=true`, {
            headers: Auth.getHeaders()
        });

        if (!res.ok) throw new Error('Failed to load modules');

        const data = await res.json();
        modules = data.modules || [];

        // Also fetch the assessment for this course
        let assessment = null;
        try {
            const examRes = await fetch(`${Auth.apiBase}/exams/course/${courseId}`, {
                headers: Auth.getHeaders()
            });
            if (examRes.ok) {
                const examData = await examRes.json();
                if (Array.isArray(examData) && examData.length > 0) {
                    assessment = examData[0];
                }
            }
        } catch (e) {
            console.warn('Could not load assessment data', e);
        }

        renderModules(assessment);

    } catch (err) {
        console.error('Failed to load modules:', err);
        UI.error('Failed to load modules');
    } finally {
        UI.hideLoader();
    }
}

// Render standard modules
function renderModules(assessment = null) {
    const container = document.getElementById('moduleList');
    if (!container) return;

    const getContentTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return '<i class="fas fa-play-circle" style="color: #17a2b8;" title="Video"></i>';
            case 'pdf':
                return '<i class="fas fa-file-pdf" style="color: #721c24;" title="PDF"></i>';
            case 'rich-content':
            default:
                return '<i class="fas fa-align-left" style="color: #0056b3;" title="Rich Content"></i>';
        }
    };

    let htmlContent = modules.length === 0 ? `
        <div style="text-align: center; padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed #ced4da; margin-bottom: 20px;">
            <i class="fas fa-layer-group" style="font-size: 3rem; color: #dee2e6; margin-bottom: 15px;"></i>
            <h5 style="color: #6c757d; margin-bottom: 5px;">No Modules Added</h5>
            <p style="color: #adb5bd; font-size: 0.9rem; margin-bottom: 0;">Create your first module to begin building the curriculum.</p>
        </div>` : modules.map(module => `
        <div class="module-item" data-module-id="${module._id}">
            <div class="module-header">
                <i class="fas fa-grip-vertical drag-handle"></i>
                <div class="module-info">
                    <div class="module-title">
                        ${getContentTypeIcon(module.contentType || 'rich-content')}
                        ${module.order + 1}. ${module.title}
                    </div>
                    <div class="module-meta">
                        ${module.status === 'Published' ? '<span style="color: #28a745;">• Published</span>' : (module.status === 'Approved' ? '<span style="color: #17a2b8;">• Approved (Upcoming)</span>' : '<span style="color: #ffc107;">• ' + module.status + '</span>')}
                    </div>
                </div>
                <div class="module-actions">
                    <button class="icon-btn" onclick="editModule('${module._id}')" title="Edit Content">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete" onclick="deleteModule('${module._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${module.description ? `<p style="margin: 10px 0 0 30px; color: #6c757d; font-size: 0.9rem;">${module.description}</p>` : ''}
        </div>
    `).join('');

    // Append Final Assessment Block
    htmlContent += `
        <div class="module-item" style="border-left: 4px solid #764ba2; background: #faf5ff; margin-top: 20px;">
            <div class="module-header">
                <div style="width: 20px;"></div> <!-- Spacer for drag handle to align nicely -->
                <div class="module-info">
                    <div class="module-title" style="color: #764ba2;">
                        <i class="fas fa-graduation-cap" style="color: #764ba2;"></i>
                        Final Assessment
                    </div>
                    <div class="module-meta">
                        ${assessment
            ? (assessment.approvalStatus === 'Approved' ? '<span style="color: #28a745;">• Approved</span>' : (assessment.approvalStatus === 'Rejected' ? '<span style="color: #dc3545;">• Rejected</span>' : '<span style="color: #ffc107;">• Pending Approval</span>')) + ` <span style="margin-left:8px; color:#666;">(${assessment.questions ? assessment.questions.length : 0} Questions)</span>`
            : '<span style="color: #6c757d;">• No assessment created yet</span>'
        }
                    </div>
                </div>
                <div class="module-actions">
                    ${assessment
            ? `<button class="icon-btn" onclick="openAssessmentEditor('${assessment._id}')" title="Edit Assessment" style="border-color: #764ba2; color: #764ba2;">
                               <i class="fas fa-edit"></i> Edit
                           </button>`
            : `<button class="icon-btn" onclick="openAssessmentEditor()" title="Create Assessment" style="background: #764ba2; color: white; border: none;">
                               <i class="fas fa-plus"></i> Create
                           </button>`
        }
                </div>
            </div>
            <p style="margin: 10px 0 0 30px; color: #6c757d; font-size: 0.85rem;">
                ${assessment ? assessment.title : 'Required for students to claim certification upon completing this course.'}
            </p>
        </div>
    `;

    container.innerHTML = htmlContent;

    // Initialize drag-drop
    initializeSortable();
}

/**
 * Open the assessment editor for the current course
 * @param {string} assessmentId - Optional ID of existing assessment
 */
function openAssessmentEditor(assessmentId = null) {
    if (!currentCourse) {
        UI.error('No course selected');
        return;
    }

    let url = `staff-assessments.html?courseId=${currentCourse}`;
    if (assessmentId) {
        url += `&examId=${assessmentId}`;
    }
    window.location.href = url;
}

/**
 * Initialize Sortable.js for drag-drop
 */
function initializeSortable() {
    const container = document.getElementById('moduleList');

    if (sortable) {
        sortable.destroy();
    }

    sortable = new Sortable(container, {
        animation: 200,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: handleReorder
    });
}

/**
 * Handle module reorder
 */
async function handleReorder(evt) {
    const newOrder = Array.from(document.querySelectorAll('.module-item')).map((item, index) => {
        return {
            id: item.dataset.moduleId,
            order: index
        };
    });

    try {
        const res = await fetch(`${Auth.apiBase}/courses/${currentCourse}/modules/reorder`, {
            method: 'PUT',
            headers: {
                ...Auth.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ moduleOrders: newOrder })
        });

        if (!res.ok) throw new Error('Failed to reorder');

        // Update local order
        modules.forEach(module => {
            const found = newOrder.find(o => o.id === module._id);
            if (found) module.order = found.order;
        });

        UI.success('Modules reordered successfully');

    } catch (err) {
        console.error('Reorder failed:', err);
        UI.error('Failed to reorder modules');
        // Reload to restore original order
        await loadModules(currentCourse);
    }
}

/**
 * Edit module
 */
window.editModule = function (moduleId) {
    if (!currentCourse) return;
    window.location.href = `module-editor.html?courseId=${currentCourse}&moduleId=${moduleId}`;
};

/**
 * Delete module
 */
window.deleteModule = async function (moduleId) {
    const module = modules.find(m => m._id === moduleId);
    if (!module) return;

    if (!confirm(`Are you sure you want to delete "${module.title}"?\n\nThis cannot be undone.`)) {
        return;
    }

    try {
        UI.showLoader();

        const res = await fetch(`${Auth.apiBase}/modules/${moduleId}`, {
            method: 'DELETE',
            headers: Auth.getHeaders()
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to delete');
        }

        UI.success('Module deleted successfully');
        await loadModules(currentCourse);

    } catch (err) {
        console.error('Delete failed:', err);
        UI.error('Failed to delete module: ' + err.message);
    } finally {
        UI.hideLoader();
    }
};

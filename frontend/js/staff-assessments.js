/**
 * Staff Assessment Management Functions
 */

let currentEditingExamId = null;
let currentExamStep = 1;
let questionCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const authData = Auth.checkAuth(['Staff', 'Admin']);
    if (!authData) return;

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const examId = urlParams.get('examId');

    if (!courseId) {
        UI.error('No course selected for assessment');
        window.history.back();
        return;
    }

    // Initialize course ID field
    document.getElementById('examCourseIdInput').value = courseId;

    // We can also fetch course details if needed, but for now we just need the ID to save the assessment properly.

    if (examId) {
        // Edit Mode
        document.getElementById('examSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Assessment';
        document.getElementById('examForm').onsubmit = handleUpdateExam;
        await loadAssessmentForEdit(examId);
    } else {
        // Create Mode
        document.getElementById('examSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Create Assessment';
        document.getElementById('examForm').onsubmit = handleCreateExam;
        addQuestionField(); // Start with one empty question
    }

    updateExamStepUI();
});

// --- Modal Wizard Navigation Logic ---

function navExamStep(step) {
    if (step === 1 && !validateExamStep(currentExamStep)) {
        return;
    }

    currentExamStep += step;

    // Boundary checks
    if (currentExamStep < 1) currentExamStep = 1;
    if (currentExamStep > 4) currentExamStep = 4;

    updateExamStepUI();
}

function updateExamStepUI() {
    // Hide all steps
    document.querySelectorAll('.exam-step').forEach(step => step.style.display = 'none');

    // Show current step
    document.getElementById(`examStep${currentExamStep}`).style.display = 'block';

    // Update progress bar
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        const stepNum = parseInt(indicator.dataset.step);
        const circle = indicator.querySelector('.step-circle');

        if (stepNum < currentExamStep) {
            // Completed
            indicator.style.opacity = '1';
            circle.style.background = '#28a745';
            circle.style.borderColor = '#28a745';
            circle.style.color = 'white';
            circle.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === currentExamStep) {
            // Current
            indicator.style.opacity = '1';
            circle.style.background = 'var(--color-golden)';
            circle.style.borderColor = 'var(--color-golden)';
            circle.style.color = '#1a1a1a';
            circle.innerHTML = stepNum;
        } else {
            // Future
            indicator.style.opacity = '0.6';
            circle.style.background = 'transparent';
            circle.style.borderColor = 'white';
            circle.style.color = 'white';
            circle.innerHTML = stepNum;
        }
    });

    // Handle Buttons
    const prevBtn = document.getElementById('examPrevBtn');
    const nextBtn = document.getElementById('examNextBtn');
    const submitBtn = document.getElementById('examSubmitBtn');

    if (currentExamStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-flex';
    }

    if (currentExamStep === 4) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
        generateExamReview(); // Build review summary
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function validateExamStep(step) {
    if (step === 1) {
        const title = document.getElementById('examTitle').value;
        if (!title) {
            UI.error('Please enter an assessment title.');
            return false;
        }
    } else if (step === 2) {
        const duration = parseInt(document.getElementById('examDuration').value);
        const passingScore = parseInt(document.getElementById('examPassingScore').value);

        if (!duration || duration < 5) {
            UI.error('Duration must be at least 5 minutes.');
            return false;
        }
        if (!passingScore || passingScore < 0 || passingScore > 100) {
            UI.error('Passing score must be between 0 and 100.');
            return false;
        }
    } else if (step === 3) {
        const questions = document.querySelectorAll('.question-item');
        if (questions.length === 0) {
            UI.error('Please add at least one question.');
            return false;
        }
    }
    return true;
}

function generateExamReview() {
    const title = document.getElementById('examTitle').value;
    const duration = document.getElementById('examDuration').value;
    const passingScore = document.getElementById('examPassingScore').value;
    const threshold = document.getElementById('examThreshold').value;
    const questionCount = document.querySelectorAll('.question-item').length;

    const reviewHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4 style="margin: 0 0 10px 0; color: #333;">Basic Details</h4>
                <p style="margin: 5px 0;"><strong>Title:</strong> ${title}</p>
                <p style="margin: 5px 0;"><strong>Target Course:</strong> (Linked Automatically)</p>
            </div>
            <div>
                <h4 style="margin: 0 0 10px 0; color: #333;">Settings</h4>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} min</p>
                <p style="margin: 5px 0;"><strong>Passing Score:</strong> ${passingScore}%</p>
                <p style="margin: 5px 0;"><strong>Activation Threshold:</strong> ${threshold}%</p>
            </div>
            <div style="grid-column: 1 / -1; background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #0d6efd; margin-top: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #0d6efd;"><i class="fas fa-list-ol"></i> Content Summary</h4>
                <p style="margin: 0; color: #084298;">This assessment contains a total of <strong>${questionCount}</strong> question(s).</p>
            </div>
        </div>
    `;

    document.getElementById('examReview').innerHTML = reviewHtml;
}

// --- Dynamic Form Question Adding Logic ---
function addQuestionField() {
    questionCounter++;
    const container = document.getElementById('questionContainer');

    // Hide empty state if present
    const emptyState = document.getElementById('emptyQuestionsState');
    if (emptyState) emptyState.style.display = 'none';

    const div = document.createElement('div');
    div.className = 'question-item';
    div.id = `question-${questionCounter}`;
    div.style.cssText = 'background: white; border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin-bottom: 20px; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.02);';

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <h4 style="margin: 0; color: #333;"><span style="background: var(--color-golden); color: #1a1a1a; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">Q</span> Question Details</h4>
            <button type="button" class="btn-primary flex-center" style="background: #dc3545; color: white; padding: 5px 10px; font-size: 0.8rem;" onclick="removeQuestionField(${questionCounter})">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
        
        <div class="form-group mb-3">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Question Text *</label>
            <textarea name="questions[${questionCounter}][text]" class="form-control" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; min-height: 80px;" rows="2" placeholder="Enter your question here..." required></textarea>
        </div>
        
        <div class="form-group mb-3">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Question Type</label>
            <select name="questions[${questionCounter}][type]" class="form-control" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;" onchange="toggleQuestionOptions(${questionCounter})">
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer (Manual Review)</option>
            </select>
        </div>
        
        <!-- Options Container -->
        <div id="options-container-${questionCounter}" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px dashed #ccc;">
            <label style="display: block; margin-bottom: 10px; font-weight: 500;"><i class="fas fa-list-ul"></i> Answer Options</label>
            <p style="font-size: 0.8rem; color: #6c757d; margin-top: -5px; margin-bottom: 15px;">Provide options and select the correct answer via the radio button.</p>
            
            <div id="options-list-${questionCounter}">
                ${generateOptionHTML(questionCounter, 0, 'A')}
                ${generateOptionHTML(questionCounter, 1, 'B')}
                ${generateOptionHTML(questionCounter, 2, 'C')}
                ${generateOptionHTML(questionCounter, 3, 'D')}
            </div>
            
            <button type="button" class="btn-primary mt-2" style="background: #6c757d; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem;" onclick="addOptionField(${questionCounter})">
                <i class="fas fa-plus"></i> Add Option
            </button>
        </div>
    `;

    container.appendChild(div);
    updateQuestionCount();
}

function generateOptionHTML(qId, oIdx, letter = '') {
    return `
        <div class="option-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <input type="radio" name="questions[${qId}][correct]" value="${oIdx}" ${oIdx === 0 ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
            ${letter ? `<span style="background: #e9ecef; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-weight: bold; color: #555;">${letter}</span>` : ''}
            <input type="text" name="questions[${qId}][options][${oIdx}]" class="form-control" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="Option text" required>
            <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: #dc3545; cursor: pointer; padding: 5px;"><i class="fas fa-times"></i></button>
        </div>
    `;
}

function addOptionField(qId) {
    const list = document.getElementById(`options-list-${qId}`);
    const items = list.querySelectorAll('.option-item');
    const newIdx = items.length;

    const div = document.createElement('div');
    div.innerHTML = generateOptionHTML(qId, newIdx);
    list.appendChild(div.firstElementChild);
}

function removeQuestionField(id) {
    const el = document.getElementById(`question-${id}`);
    if (el) {
        el.style.transform = 'scale(0.95)';
        el.style.opacity = '0';
        setTimeout(() => {
            el.remove();
            updateQuestionCount();

            if (document.querySelectorAll('.question-item').length === 0) {
                const emptyState = document.getElementById('emptyQuestionsState');
                if (emptyState) emptyState.style.display = 'block';
            }
        }, 200);
    }
}

function updateQuestionCount() {
    const count = document.querySelectorAll('.question-item').length;
    const countEl = document.getElementById('questionCount');
    if (countEl) {
        countEl.textContent = count;
        countEl.style.background = count > 0 ? 'var(--color-golden)' : '#f0f0f0';
        countEl.style.color = count > 0 ? '#1a1a1a' : '#666';
    }
}

function toggleQuestionOptions(qId) {
    const type = document.querySelector(`select[name="questions[${qId}][type]"]`).value;
    const optionsContainer = document.getElementById(`options-container-${qId}`);

    if (type === 'multiple-choice') {
        optionsContainer.style.display = 'block';
        // Reset to 4 default options if currently true/false
        const list = document.getElementById(`options-list-${qId}`);
        if (list.children.length === 2 && list.querySelector('input[type="text"]').value === 'True') {
            list.innerHTML = `
                ${generateOptionHTML(qId, 0, 'A')}
                ${generateOptionHTML(qId, 1, 'B')}
                ${generateOptionHTML(qId, 2, 'C')}
                ${generateOptionHTML(qId, 3, 'D')}
            `;
        }
    } else if (type === 'true-false') {
        optionsContainer.style.display = 'block';
        const list = document.getElementById(`options-list-${qId}`);
        list.innerHTML = `
            <div class="option-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <input type="radio" name="questions[${qId}][correct]" value="0" checked style="width: 20px; height: 20px; cursor: pointer;">
                <input type="text" name="questions[${qId}][options][0]" class="form-control" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #e9ecef;" value="True" readonly>
            </div>
            <div class="option-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <input type="radio" name="questions[${qId}][correct]" value="1" style="width: 20px; height: 20px; cursor: pointer;">
                <input type="text" name="questions[${qId}][options][1]" class="form-control" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #e9ecef;" value="False" readonly>
            </div>
        `;
    } else if (type === 'short-answer') {
        optionsContainer.style.display = 'none';
    }
}


// --- Create/Edit Operations ---

async function handleCreateExam(e) {
    e.preventDefault();
    if (!validateExamStep(3)) return;

    const formData = new FormData(e.target);
    const data = {
        courseID: formData.get('courseID'),
        title: formData.get('title').trim(),
        duration: parseInt(formData.get('duration')),
        passingScore: parseInt(formData.get('passingScore')),
        activationThreshold: parseInt(formData.get('activationThreshold')),
        questions: []
    };

    const qItems = document.querySelectorAll('.question-item');
    qItems.forEach(item => {
        const idParts = item.id.split('-');
        const id = idParts[idParts.length - 1];

        const qText = item.querySelector(`textarea[name="questions[${id}][text]"]`).value;
        const qType = item.querySelector(`select[name="questions[${id}][type]"]`).value;
        const optsInputs = Array.from(item.querySelectorAll(`input[name^="questions[${id}][options]"]`));
        const opts = optsInputs.map(input => input.value);

        let correctIndices = [];
        if (qType === 'multiple-choice' || qType === 'true-false') {
            const radio = item.querySelector(`input[type="radio"][name="questions[${id}][correct]"]:checked`);
            if (radio) {
                correctIndices.push(parseInt(radio.value));
            }
        } else if (qType === 'short-answer') {
            correctIndices = [0];
        }

        data.questions.push({
            question: qText,
            type: qType,
            options: opts,
            correctAnswerIndices: correctIndices
        });
    });

    try {
        UI.showLoader();
        const res = await fetch(`${Auth.apiBase}/exams/create`, {
            method: 'POST',
            headers: Auth.getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            UI.success('Assessment created successfully!');
            setTimeout(() => {
                window.history.back(); // Return to Curriculum page
            }, 1000);
        } else {
            console.error('Creation failed:', result);
            UI.error(result.message || 'Creation failed');
        }
    } catch (err) {
        console.error('Exam creation error:', err);
        UI.error('Assessment creation failed. Please try again.');
    } finally {
        UI.hideLoader();
    }
}

async function loadAssessmentForEdit(examId) {
    try {
        UI.showLoader();

        const examRes = await fetch(`${Auth.apiBase}/exams/${examId}`, { headers: Auth.getHeaders() });
        if (!examRes.ok) throw new Error('Failed to fetch data');

        const exam = await examRes.json();
        currentEditingExamId = examId;

        // Populate form with existing data
        document.getElementById('examTitle').value = exam.title;
        document.getElementById('examDuration').value = exam.duration;
        document.getElementById('examPassingScore').value = exam.passingScore;
        document.getElementById('examThreshold').value = exam.activationThreshold;

        // Clear and populate questions
        const container = document.getElementById('questionContainer');
        container.innerHTML = '';
        questionCounter = 0;

        exam.questions.forEach((q) => {
            addQuestionField();

            const currentId = questionCounter;
            const currentBlock = document.getElementById(`question-${currentId}`);

            if (currentBlock) {
                // Populate Question Text
                const qText = currentBlock.querySelector(`textarea[name="questions[${currentId}][text]"]`);
                if (qText) qText.value = q.questionText || q.question || '';

                // Populate Type
                const qType = currentBlock.querySelector(`select[name="questions[${currentId}][type]"]`);
                if (qType) {
                    qType.value = q.type || 'multiple-choice';
                    toggleQuestionOptions(currentId);
                }

                // Populate Options
                if (q.options) {
                    q.options.forEach((opt, optIdx) => {
                        const optInput = currentBlock.querySelector(`input[name="questions[${currentId}][options][${optIdx}]"]`);
                        if (optInput) optInput.value = opt;
                    });
                }

                // Set correct answers (Radio buttons in the current UI)
                const correctIndices = q.correctOptionIndices || q.correctAnswerIndices || [];
                if (correctIndices.length > 0) {
                    const correctVal = correctIndices[0];
                    const radio = currentBlock.querySelector(`input[type="radio"][name="questions[${currentId}][correct]"][value="${correctVal}"]`);
                    if (radio) radio.checked = true;
                }
            }
        });

    } catch (err) {
        console.error('Error loading assessment for edit:', err);
        UI.error('Failed to load assessment details');
        window.history.back();
    } finally {
        UI.hideLoader();
    }
}

async function handleUpdateExam(e) {
    e.preventDefault();
    if (!validateExamStep(3)) return;

    const formData = new FormData(e.target);
    const data = {
        courseID: formData.get('courseID'),
        title: formData.get('title').trim(),
        duration: parseInt(formData.get('duration')),
        passingScore: parseInt(formData.get('passingScore')),
        activationThreshold: parseInt(formData.get('activationThreshold')),
        questions: []
    };

    const qItems = document.querySelectorAll('.question-item');
    qItems.forEach(item => {
        const idParts = item.id.split('-');
        const id = idParts[idParts.length - 1];

        const qText = item.querySelector(`textarea[name="questions[${id}][text]"]`).value;
        const qType = item.querySelector(`select[name="questions[${id}][type]"]`).value;
        const opts = Array.from(item.querySelectorAll(`input[name^="questions[${id}][options]"]`)).map(input => input.value);

        let correctIndices = [];
        if (qType === 'multiple-choice' || qType === 'true-false') {
            const radio = item.querySelector(`input[type="radio"][name="questions[${id}][correct]"]:checked`);
            if (radio) {
                correctIndices.push(parseInt(radio.value));
            }
        } else if (qType === 'short-answer') {
            correctIndices = [0];
        }

        data.questions.push({
            question: qText,
            type: qType,
            options: opts,
            correctAnswerIndices: correctIndices
        });
    });

    try {
        UI.showLoader();

        const res = await fetch(`${Auth.apiBase}/exams/${currentEditingExamId}`, {
            method: 'PUT',
            headers: Auth.getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            UI.success('Assessment updated successfully!');
            setTimeout(() => {
                window.history.back();
            }, 1000);
        } else {
            console.error('Update failed:', result);
            UI.error(result.message || 'Update failed');
        }
    } catch (err) {
        console.error('Exam update error:', err);
        UI.error('Assessment update failed. Please try again.');
    } finally {
        UI.hideLoader();
    }
}

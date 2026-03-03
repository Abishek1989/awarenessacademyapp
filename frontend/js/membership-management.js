// Membership Management JavaScript

let currentMemberships = [];
let editingMembershipId = null;
let classSchedule = {}; // Store class schedule data: { day: [{startTime, endTime}] }

// ========================================
// FORM STAGE MANAGEMENT
// ========================================

function nextFormStage() {
    const currentStep = parseInt(document.getElementById('currentFormStep').value);
    
    // Validate current stage before moving forward
    if (!validateCurrentStage(currentStep)) {
        return;
    }
    
    const nextStep = currentStep + 1;
    if (nextStep <= 5) {
        showFormStage(nextStep);
    }
}

function previousFormStage() {
    const currentStep = parseInt(document.getElementById('currentFormStep').value);
    const prevStep = currentStep - 1;
    
    if (prevStep >= 1) {
        showFormStage(prevStep);
    }
}

function showFormStage(step) {
    // Hide all stages
    document.querySelectorAll('.form-stage').forEach(stage => {
        stage.style.display = 'none';
    });
    
    // Show current stage
    document.getElementById(`stage${step}`).style.display = 'block';
    document.getElementById('currentFormStep').value = step;
    
    // Update step indicator
    updateStepIndicator(step);
    
    // Update navigation buttons
    updateNavigationButtons(step);
    
    // Generate summary if on review stage
    if (step === 5) {
        generateReviewSummary();
    }
}

function updateStepIndicator(currentStep) {
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.getElementById('progressBar');
    
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        const circle = step.querySelector('.step-circle');
        const label = step.querySelector('div:last-child');
        
        if (stepNumber < currentStep) {
            // Completed steps
            circle.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
            circle.style.color = 'white';
            circle.style.boxShadow = '0 3px 10px rgba(76, 175, 80, 0.3)';
            label.style.color = '#4caf50';
        } else if (stepNumber === currentStep) {
            // Current step
            circle.style.background = 'linear-gradient(135deg, var(--color-saffron) 0%, var(--color-golden) 100%)';
            circle.style.color = 'white';
            circle.style.boxShadow = '0 3px 10px rgba(255, 138, 0, 0.3)';
            label.style.color = '#333';
        } else {
            // Future steps
            circle.style.background = '#dee2e6';
            circle.style.color = '#6c757d';
            circle.style.boxShadow = 'none';
            label.style.color = '#6c757d';
        }
    });
    
    // Update progress bar
    const progress = ((currentStep - 1) / 4) * 100;
    progressBar.style.width = `${progress}%`;
}

function updateNavigationButtons(step) {
    const prevBtn = document.getElementById('prevStageBtn');
    const nextBtn = document.getElementById('nextStageBtn');
    const submitBtn = document.getElementById('membershipSubmitBtn');
    
    // Show/hide previous button
    prevBtn.style.display = step > 1 ? 'block' : 'none';
    
    // Show/hide next vs submit button
    if (step < 5) {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    }
}

function validateCurrentStage(stage) {
    switch(stage) {
        case 1: // Basic Information
            return validateStage1();
        case 2: // Duration & Timeline
            return validateStage2();
        case 3: // Package Features
            return validateStage3();
        case 4: // Class Schedule (optional)
            return true; // Optional stage, always valid
        case 5: // Review
            return true;
        default:
            return false;
    }
}

function validateStage1() {
    const packageName = document.getElementById('packageName').value.trim();
    const originalPrice = parseFloat(document.getElementById('originalPrice').value);
    const offeredPrice = parseFloat(document.getElementById('offeredPrice').value);
    
    if (!packageName) {
        showNotification('Please enter a package name', 'error');
        return false;
    }
    
    if (!originalPrice || originalPrice <= 0) {
        showNotification('Please enter a valid original price', 'error');
        return false;
    }
    
    if (!offeredPrice || offeredPrice <= 0) {
        showNotification('Please enter a valid offered price', 'error');
        return false;
    }
    
    if (offeredPrice >= originalPrice) {
        showNotification('Offered price must be less than original price', 'error');
        return false;
    }
    
    // Check package name uniqueness (synchronous check from previous validation)
    const errorDiv = document.getElementById('packageNameError');
    if (errorDiv.style.display !== 'none') {
        showNotification('Please fix the package name error', 'error');
        return false;
    }
    
    return true;
}

function validateStage2() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const offerEndsAt = document.getElementById('offerEndsAt').value;
    
    if (!startDate || !endDate || !offerEndsAt) {
        showNotification('Please fill in all date fields', 'error');
        return false;
    }
    
    return validateDates();
}

function validateStage3() {
    const featureInputs = document.querySelectorAll('#featurePointsContainer .feature-point-input');
    const features = Array.from(featureInputs)
        .map(input => input.value.trim())
        .filter(f => f.length > 0);
    
    if (features.length === 0) {
        showNotification('Please add at least one feature point', 'error');
        return false;
    }
    
    return true;
}

// ========================================
// DISCOUNT CALCULATOR
// ========================================

function calculateDiscount() {
    const originalPrice = parseFloat(document.getElementById('originalPrice').value);
    const offeredPrice = parseFloat(document.getElementById('offeredPrice').value);
    const discountBadge = document.getElementById('discountBadge');
    const priceError = document.getElementById('priceError');
    const priceErrorText = document.getElementById('priceErrorText');
    
    // Null check for elements
    if (!discountBadge || !priceError || !priceErrorText) {
        return;
    }
    
    if (!originalPrice || !offeredPrice) {
        discountBadge.style.display = 'none';
        priceError.style.display = 'none';
        return;
    }
    
    if (offeredPrice >= originalPrice) {
        priceError.style.display = 'block';
        priceErrorText.textContent = 'Offered price must be less than original price';
        priceError.style.color = '#e74c3c';
        discountBadge.style.display = 'none';
        return;
    }
    
    // Calculate and show discount
    const discount = Math.round(((originalPrice - offeredPrice) / originalPrice) * 100);
    discountBadge.textContent = `${discount}% OFF`;
    discountBadge.style.display = 'block';
    
    // Show success message with discount
    priceError.style.display = 'block';
    priceError.style.color = '#4caf50';
    priceErrorText.textContent = `Great! ${discount}% discount offered`;
}

// ========================================
// DATE VALIDATION
// ========================================

function validateDates() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const dateError = document.getElementById('dateError');
    const dateErrorText = document.getElementById('dateErrorText');
    
    // Null check for elements
    if (!dateError || !dateErrorText) {
        return true;
    }
    
    if (!startDate || !endDate) {
        return true; // Skip validation if dates not entered yet
    }
    
    if (endDate <= startDate) {
        dateError.style.display = 'block';
        dateErrorText.textContent = 'End date must be after start date';
        return false;
    }
    
    dateError.style.display = 'none';
    return true;
}

// ========================================
// CLASS SCHEDULE MANAGEMENT
// ========================================

function toggleDaySchedule(day) {
    const checkbox = document.querySelector(`input[value="${day}"]`);
    const container = document.getElementById('timeSlotsContainer');
    
    if (checkbox.checked) {
        // Add day schedule card
        if (!classSchedule[day]) {
            classSchedule[day] = [];
        }
        renderDayScheduleCard(day);
    } else {
        // Remove day schedule
        delete classSchedule[day];
        const card = document.getElementById(`schedule-${day}`);
        if (card) {
            card.remove();
        }
    }
}

function renderDayScheduleCard(day) {
    const container = document.getElementById('timeSlotsContainer');
    const existingCard = document.getElementById(`schedule-${day}`);
    
    if (existingCard) {
        return; // Card already exists
    }
    
    const card = document.createElement('div');
    card.id = `schedule-${day}`;
    card.className = 'time-slot-card';
    card.innerHTML = `
        <h5 style="margin: 0 0 15px 0; color: #333; font-size: 1rem; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fas fa-calendar-day" style="color: var(--color-saffron); margin-right: 8px;"></i>${day}</span>
            <button type="button" onclick="addTimeSlot('${day}')" 
                style="background: var(--color-saffron); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; transition: all 0.2s;"
                onmouseover="this.style.background='var(--color-golden)'"
                onmouseout="this.style.background='var(--color-saffron)'">
                <i class="fas fa-plus"></i> Add Slot
            </button>
        </h5>
        <div id="slots-${day}">
            ${renderTimeSlots(day)}
        </div>
    `;
    
    container.appendChild(card);
}

function renderTimeSlots(day) {
    const slots = classSchedule[day] || [];
    
    if (slots.length === 0) {
        return `<p style="color: #999; font-size: 0.9rem; font-style: italic;">No time slots added yet</p>`;
    }
    
    return slots.map((slot, index) => `
        <div class="time-slot-item ${slot.conflict ? 'conflict-warning' : ''}" id="slot-${day}-${index}">
            <input type="time" value="${slot.startTime}" onchange="updateTimeSlot('${day}', ${index}, 'start', this.value)"
                style="padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem;" required />
            <span style="color: #666;">to</span>
            <input type="time" value="${slot.endTime}" onchange="updateTimeSlot('${day}', ${index}, 'end', this.value)"
                style="padding: 8px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem;" required />
            ${slot.conflict ? `<span style="color: #e74c3c; font-size: 0.85rem; flex: 1;"><i class="fas fa-exclamation-triangle"></i> Time conflict!</span>` : ''}
            <button type="button" onclick="removeTimeSlot('${day}', ${index})"
                style="background: #fee; color: #e74c3c; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.background='#e74c3c'; this.style.color='white';"
                onmouseout="this.style.background='#fee'; this.style.color='#e74c3c';">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addTimeSlot(day) {
    if (!classSchedule[day]) {
        classSchedule[day] = [];
    }
    
    // Add new slot with default times
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:00`;
    const endTime = `${String(now.getHours() + 1).padStart(2, '0')}:00`;
    
    classSchedule[day].push({ startTime, endTime, conflict: false });
    
    // Re-render slots
    const slotsContainer = document.getElementById(`slots-${day}`);
    slotsContainer.innerHTML = renderTimeSlots(day);
    
    // Check for conflicts
    detectTimeConflicts(day);
}

function removeTimeSlot(day, index) {
    classSchedule[day].splice(index, 1);
    
    // Re-render slots
    const slotsContainer = document.getElementById(`slots-${day}`);
    slotsContainer.innerHTML = renderTimeSlots(day);
    
    // Check for conflicts
    detectTimeConflicts(day);
}

function updateTimeSlot(day, index, type, value) {
    if (type === 'start') {
        classSchedule[day][index].startTime = value;
    } else {
        classSchedule[day][index].endTime = value;
    }
    
    // Check for conflicts
    detectTimeConflicts(day);
    
    // Re-render to show/hide conflict warnings
    const slotsContainer = document.getElementById(`slots-${day}`);
    slotsContainer.innerHTML = renderTimeSlots(day);
}

function detectTimeConflicts(day) {
    const slots = classSchedule[day];
    if (!slots || slots.length < 2) {
        return;
    }
    
    // Reset conflict flags
    slots.forEach(slot => slot.conflict = false);
    
    // Check each pair of slots for overlaps
    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            const slot1 = slots[i];
            const slot2 = slots[j];
            
            // Convert times to minutes for comparison
            const start1 = timeToMinutes(slot1.startTime);
            const end1 = timeToMinutes(slot1.endTime);
            const start2 = timeToMinutes(slot2.startTime);
            const end2 = timeToMinutes(slot2.endTime);
            
            // Check for overlap
            if (start1 < end2 && end1 > start2) {
                slot1.conflict = true;
                slot2.conflict = true;
            }
        }
    }
    
    // Show error if conflicts exist
    const hasConflict = slots.some(slot => slot.conflict);
    const errorDiv = document.getElementById('scheduleError');
    const errorText = document.getElementById('scheduleErrorText');
    
    // Null check for error elements
    if (!errorDiv || !errorText) {
        return;
    }
    
    if (hasConflict) {
        errorDiv.style.display = 'block';
        errorText.textContent = `Time slot conflicts detected for ${day}. Please adjust the times.`;
    } else {
        errorDiv.style.display = 'none';
    }
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// ========================================
// REVIEW SUMMARY GENERATION
// ========================================

function generateReviewSummary() {
    const packageName = document.getElementById('packageName').value;
    const originalPrice = document.getElementById('originalPrice').value;
    const offeredPrice = document.getElementById('offeredPrice').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const offerEndsAt = document.getElementById('offerEndsAt').value;
    
    const discount = Math.round(((originalPrice - offeredPrice) / originalPrice) * 100);
    
    // Get features
    const featureInputs = document.querySelectorAll('#featurePointsContainer .feature-point-input');
    const features = Array.from(featureInputs)
        .map(input => input.value.trim())
        .filter(f => f.length > 0);
    
    // Get schedule summary
    let scheduleSummary = 'No class schedule set';
    if (Object.keys(classSchedule).length > 0) {
        const days = Object.keys(classSchedule).filter(day => classSchedule[day].length > 0);
        if (days.length > 0) {
            scheduleSummary = days.map(day => {
                const slots = classSchedule[day];
                const slotTimes = slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
                return `<strong>${day}:</strong> ${slotTimes}`;
            }).join('<br>');
        }
    }
    
    const summaryHTML = `
        <div style="display: grid; gap: 15px;">
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Package Name:</strong>
                <span>${packageName}</span>
            </div>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Pricing:</strong>
                <span>
                    <s>₹${parseInt(originalPrice).toLocaleString()}</s> 
                    <strong style="color: var(--color-saffron);">₹${parseInt(offeredPrice).toLocaleString()}</strong>
                    <span style="background: #4caf50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px;">${discount}% OFF</span>
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Duration:</strong>
                <span>${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
            </div>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Offer Ends:</strong>
                <span>${new Date(offerEndsAt).toLocaleString()}</span>
            </div>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Features:</strong>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    ${features.map(f => `<span><i class="fas fa-check-circle" style="color: var(--color-saffron);"></i> ${f}</span>`).join('')}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 10px; padding: 10px; background: white; border-radius: 8px;">
                <strong>Class Schedule:</strong>
                <div style="font-size: 0.9rem; line-height: 1.6;">${scheduleSummary}</div>
            </div>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = summaryHTML;
}

// ========================================
// EXISTING FUNCTIONS (Load Memberships, Display, etc.)
// ========================================

// Load memberships on section switch
async function loadMemberships() {
    try {
        const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api';
        const response = await fetch(`${apiBase}/memberships/admin/all`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (data.success) {
            currentMemberships = data.memberships || [];
            displayMemberships(currentMemberships);
        } else {
            showNotification('Error loading memberships', 'error');
        }
    } catch (error) {
        console.error('Error loading memberships:', error);
        showNotification('Error loading memberships', 'error');
        displayEmptyState();
    }
}

// Display memberships in grid
function displayMemberships(memberships) {
    const grid = document.getElementById('membershipsGrid');
    const emptyState = document.getElementById('membershipsEmptyState');

    if (!memberships || memberships.length === 0) {
        displayEmptyState();
        return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = memberships.map(membership => {
        const now = new Date();
        const offerExpiry = new Date(membership.offerEndsAt);
        const isExpired = offerExpiry < now;
        const discount = Math.round(((membership.originalPrice - membership.offeredPrice) / membership.originalPrice) * 100);

        return `
            <div class="membership-card-admin" style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); position: relative; ${!membership.active ? 'opacity: 0.6;' : ''}">
                ${membership.isMostPopular ? `
                <div style="position: absolute; top: -10px; right: 20px; background: var(--color-golden); color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; box-shadow: 0 3px 10px rgba(199, 151, 47, 0.3);">
                    <i class="fas fa-star"></i> MOST POPULAR
                </div>
                ` : ''}

                <div style="margin-top: ${membership.isMostPopular ? '10px' : '0'};">
                    <h3 style="color: var(--color-text-primary); margin-bottom: 15px; font-size: 1.4rem;">
                        ${membership.packageName}
                        ${!membership.active ? '<span style="color: #e74c3c; font-size: 0.8rem; margin-left: 8px;">(Inactive)</span>' : ''}
                    </h3>

                    <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 15px;">
                        <span style="text-decoration: line-through; color: #999; font-size: 1.1rem;">₹${membership.originalPrice.toLocaleString()}</span>
                        <span style="font-size: 1.8rem; font-weight: 700; color: var(--color-saffron);">₹${membership.offeredPrice.toLocaleString()}</span>
                        <span style="background: #4caf50; color: white; padding: 4px 10px; border-radius: 5px; font-size: 0.8rem; font-weight: 600;">
                            ${discount}% OFF
                        </span>
                    </div>

                    ${membership.features && Array.isArray(membership.features) && membership.features.length > 0 ? `
                    <div style="background: #f8f5f0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${membership.features.map(feature => `
                                <div style="display: flex; align-items: flex-start; gap: 8px;">
                                    <i class="fas fa-check-circle" style="color: var(--color-saffron); margin-top: 3px; font-size: 0.9rem;"></i>
                                    <span style="color: var(--color-text-secondary); line-height: 1.5; font-size: 0.9rem;">${feature}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : membership.description ? `
                    <p style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 15px; min-height: 60px;">
                        ${membership.description}
                    </p>
                    ` : ''}

                    <div style="background: #f8f5f0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <i class="fas fa-calendar-alt" style="color: var(--color-saffron);"></i>
                            <span style="font-weight: 600; color: var(--color-text-primary); font-size: 0.9rem;">Duration</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
                            <strong>Start:</strong> ${formatDate(membership.duration.startDate)}<br>
                            <strong>End:</strong> ${formatDate(membership.duration.endDate)}
                        </div>
                    </div>

                    ${membership.classTime ? `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 10px; background: linear-gradient(135deg, rgba(255, 138, 0, 0.1) 0%, rgba(199, 151, 47, 0.1) 100%); border-radius: 8px;">
                        <i class="fas fa-clock" style="color: var(--color-saffron);"></i>
                        <span style="font-size: 0.9rem; color: var(--color-text-secondary);">${membership.classTime}</span>
                    </div>
                    ` : ''}

                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 10px; background: ${isExpired ? '#fee' : '#efe'}; border-radius: 8px;">
                        <i class="fas fa-clock" style="color: ${isExpired ? '#e74c3c' : '#4caf50'};"></i>
                        <span style="font-size: 0.85rem; color: ${isExpired ? '#e74c3c' : '#4caf50'}; font-weight: 500;">
                            Offer ${isExpired ? 'Expired' : 'Ends'}: ${formatDateTime(membership.offerEndsAt)}
                        </span>
                    </div>

                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="toggleMostPopular('${membership._id}', ${membership.isMostPopular})" 
                            class="btn-secondary" 
                            style="flex: 1; min-width: 100px; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; ${membership.isMostPopular ? 'background: var(--color-golden); color: white;' : ''}">
                            <i class="fas fa-star"></i>
                            ${membership.isMostPopular ? 'Popular' : 'Mark Popular'}
                        </button>
                        <button onclick="editMembership('${membership._id}')" 
                            class="btn-secondary" 
                            style="flex: 1; min-width: 100px; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button onclick="deleteMembership('${membership._id}', '${membership.packageName}')" 
                            class="btn-secondary" 
                            style="flex: 1; min-width: 100px; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; background: #fee; color: #e74c3c;">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display empty state
function displayEmptyState() {
    const grid = document.getElementById('membershipsGrid');
    const emptyState = document.getElementById('membershipsEmptyState');
    
    grid.style.display = 'none';
    emptyState.style.display = 'block';
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Format date with time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString('en-IN', dateOptions)} at ${date.toLocaleTimeString('en-IN', timeOptions)}`;
}

// Open add membership modal
// Open add membership modal
function openAddMembershipModal() {
    editingMembershipId = null;
    classSchedule = {}; // Reset class schedule
    
    document.getElementById('membershipModalTitleText').textContent = 'Add Membership Package';
    document.getElementById('membershipForm').reset();
    document.getElementById('membershipId').value = '';
    
    // Initialize with one empty feature point
    initializeFeaturePoints([]);
    
    // Clear time slots container
    document.getElementById('timeSlotsContainer').innerHTML = '';
    
    // Uncheck all day checkboxes
    document.querySelectorAll('#daySelection input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Clear validation errors (with null checks)
    const packageNameError = document.getElementById('packageNameError');
    const priceError = document.getElementById('priceError');
    const dateError = document.getElementById('dateError');
    const scheduleError = document.getElementById('scheduleError');
    const discountBadge = document.getElementById('discountBadge');
    
    if (packageNameError) packageNameError.style.display = 'none';
    if (priceError) priceError.style.display = 'none';
    if (dateError) dateError.style.display = 'none';
    if (scheduleError) scheduleError.style.display = 'none';
    if (discountBadge) discountBadge.style.display = 'none';
    
    // Reset to stage 1
    showFormStage(1);
    
    document.getElementById('membershipModal').style.display = 'flex';
}

// Open edit membership modal
function editMembership(id) {
    const membership = currentMemberships.find(m => m._id === id);
    if (!membership) return;

    editingMembershipId = id;
    classSchedule = {}; // Reset class schedule
    
    document.getElementById('membershipModalTitleText').textContent = 'Edit Membership Package';
    document.getElementById('membershipId').value = id;
    document.getElementById('packageName').value = membership.packageName;
    document.getElementById('originalPrice').value = membership.originalPrice;
    document.getElementById('offeredPrice').value = membership.offeredPrice;
    document.getElementById('offerEndsAt').value = formatDateTimeForInput(membership.offerEndsAt);
    document.getElementById('startDate').value = formatDateTimeForInput(membership.duration.startDate);
    document.getElementById('endDate').value = formatDateTimeForInput(membership.duration.endDate);
    document.getElementById('isMostPopular').checked = membership.isMostPopular;
    
    // Populate feature points
    const features = Array.isArray(membership.features) && membership.features.length > 0
        ? membership.features
        : (membership.description ? [membership.description] : []);
    
    initializeFeaturePoints(features);
    
    // Parse and populate class schedule
    parseClassTime(membership.classTime);
    
    // Calculate and show discount
    calculateDiscount();
    
    // Clear validation errors (with null checks)
    const packageNameError = document.getElementById('packageNameError');
    const priceError = document.getElementById('priceError');
    const dateError = document.getElementById('dateError');
    const scheduleError = document.getElementById('scheduleError');
    
    if (packageNameError) packageNameError.style.display = 'none';
    if (priceError) priceError.style.display = 'none';
    if (dateError) dateError.style.display = 'none';
    if (scheduleError) scheduleError.style.display = 'none';
    
    // Reset to stage 1
    showFormStage(1);
    
    document.getElementById('membershipModal').style.display = 'flex';
}

function initializeFeaturePoints(features) {
    const container = document.getElementById('featurePointsContainer');
    container.innerHTML = '';
    
    if (features.length === 0) {
        features = [''];
    }
    
    features.forEach((feature, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'feature-point-wrapper';
        
        wrapper.innerHTML = `
            <span class="feature-number">${index + 1}</span>
            <div style="flex: 1;">
                <input 
                    type="text" 
                    class="feature-point-input" 
                    placeholder="Enter feature point (max 100 chars)"
                    required
                    maxlength="100"
                    value="${feature}"
                    oninput="updateCharCount(this)"
                    style="width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; transition: all 0.3s;"
                    onfocus="this.style.borderColor='var(--color-golden)'; this.style.boxShadow='0 0 0 3px rgba(255, 153, 51, 0.1)';"
                    onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
                >
                <div class="char-count" style="font-size: 0.8rem; color: #999; margin-top: 4px; text-align: right;">${feature.length}/100</div>
            </div>
            ${features.length > 1 ? `
            <button 
                type="button" 
                onclick="removeFeaturePoint(this)" 
                class="remove-feature-btn"
            >
                <i class="fas fa-times"></i>
            </button>
            ` : ''}
        `;
        
        container.appendChild(wrapper);
    });
}

function parseClassTime(classTimeString) {
    if (!classTimeString) return;
    
    // Clear existing schedule
    classSchedule = {};
    document.querySelectorAll('#daySelection input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('timeSlotsContainer').innerHTML = '';
    
    try {
        // Parse format: "Monday: 09:00-10:00, 14:00-15:00 | Tuesday: 10:00-11:00"
        const daySchedules = classTimeString.split(' | ');
        
        for (const daySchedule of daySchedules) {
            const [day, timesStr] = daySchedule.split(':').map(s => s.trim());
            
            if (!day || !timesStr) continue;
            
            // Parse time slots for this day
            const timeSlots = timesStr.split(',').map(s => s.trim());
            classSchedule[day] = [];
            
            for (const slot of timeSlots) {
                const [startTime, endTime] = slot.split('-').map(t => t.trim());
                if (startTime && endTime) {
                    classSchedule[day].push({
                        startTime: startTime,
                        endTime: endTime,
                        conflict: false
                    });
                }
            }
            
            // Check the day checkbox
            const checkbox = document.querySelector(`#daySelection input[value="${day}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
            
            // Render the schedule card for this day
            renderDayScheduleCard(day);
        }
        
        showNotification('Class schedule loaded successfully', 'success');
    } catch (error) {
        console.error('Error parsing class time:', error);
        showNotification('Error loading class schedule. Please re-enter manually.', 'error');
    }
}

// Feature Points Management
function addFeaturePoint() {
    const container = document.getElementById('featurePointsContainer');
    const currentPoints = container.querySelectorAll('.feature-point-wrapper');
    
    if (currentPoints.length >= 20) {
        showNotification('Maximum 20 feature points allowed', 'error');
        return;
    }
    
    const index = currentPoints.length;
    const wrapper = document.createElement('div');
    wrapper.className = 'feature-point-wrapper';
    
    wrapper.innerHTML = `
        <span class="feature-number">${index + 1}</span>
        <div style="flex: 1;">
            <input 
                type="text" 
                class="feature-point-input" 
                placeholder="Enter feature point (max 100 chars)"
                required
                maxlength="100"
                oninput="updateCharCount(this)"
                style="width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; transition: all 0.3s;"
                onfocus="this.style.borderColor='var(--color-golden)'; this.style.boxShadow='0 0 0 3px rgba(255, 153, 51, 0.1)';"
                onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none';"
            >
            <div class="char-count" style="font-size: 0.8rem; color: #999; margin-top: 4px; text-align: right;">0/100</div>
        </div>
        <button 
            type="button" 
            onclick="removeFeaturePoint(this)" 
            class="remove-feature-btn"
        >
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(wrapper);
    
    // Update all feature numbers
    updateFeatureNumbers();
}

function removeFeaturePoint(button) {
    const container = document.getElementById('featurePointsContainer');
    const currentPoints = container.querySelectorAll('.feature-point-wrapper');
    
    if (currentPoints.length <= 1) {
        showNotification('At least one feature point is required', 'error');
        return;
    }
    
    button.closest('.feature-point-wrapper').remove();
    
    // Update all feature numbers
    updateFeatureNumbers();
}

function updateFeatureNumbers() {
    const container = document.getElementById('featurePointsContainer');
    const wrappers = container.querySelectorAll('.feature-point-wrapper');
    
    wrappers.forEach((wrapper, index) => {
        const numberSpan = wrapper.querySelector('.feature-number');
        if (numberSpan) {
            numberSpan.textContent = index + 1;
        }
    });
}

function updateCharCount(input) {
    const wrapper = input.closest('div');
    const charCount = wrapper.querySelector('.char-count');
    const length = input.value.length;
    charCount.textContent = `${length}/100`;
    
    // Change color if approaching limit
    if (length >= 90) {
        charCount.style.color = '#e74c3c';
    } else if (length >= 70) {
        charCount.style.color = '#ff8a00';
    } else {
        charCount.style.color = '#999';
    }
}

// Validate package name uniqueness
async function validatePackageName() {
    const input = document.getElementById('packageName');
    const errorDiv = document.getElementById('packageNameError');
    
    // Null check for elements
    if (!input || !errorDiv) {
        return true;
    }
    
    const packageName = input.value.trim();
    
    if (!packageName) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        return true;
    }
    
    try {
        const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api';
        const response = await fetch(`${apiBase}/memberships/admin/all`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const existingMembership = data.memberships.find(m => 
                m.packageName.toLowerCase() === packageName.toLowerCase() && 
                m._id !== editingMembershipId
            );
            
            if (existingMembership) {
                errorDiv.textContent = 'This package name already exists';
                errorDiv.style.display = 'block';
                input.style.borderColor = '#e74c3c';
                return false;
            } else {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
                input.style.borderColor = '#4caf50';
                return true;
            }
        }
    } catch (error) {
        console.error('Error validating package name:', error);
    }
    
    return true;
}

// Validate pricing
function validatePricing() {
    const originalPrice = parseInt(document.getElementById('originalPrice').value);
    const offeredPrice = parseInt(document.getElementById('offeredPrice').value);
    const errorDiv = document.getElementById('priceError');
    const offeredPriceInput = document.getElementById('offeredPrice');
    
    if (!originalPrice || !offeredPrice) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        return true;
    }
    
    if (offeredPrice >= originalPrice) {
        errorDiv.textContent = 'Offered price must be less than original price';
        errorDiv.style.display = 'block';
        offeredPriceInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        offeredPriceInput.style.borderColor = '#4caf50';
        
        // Show discount percentage
        const discount = Math.round(((originalPrice - offeredPrice) / originalPrice) * 100);
        errorDiv.textContent = `${discount}% discount`;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#4caf50';
        
        return true;
    }
}

// Format date for input field
function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Close membership modal
function closeMembershipModal() {
    document.getElementById('membershipModal').style.display = 'none';
    editingMembershipId = null;
}

// Handle membership form submission
document.addEventListener('DOMContentLoaded', () => {
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        membershipForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Check for time slot conflicts before submission
            let hasConflicts = false;
            for (const day in classSchedule) {
                if (classSchedule[day].some(slot => slot.conflict)) {
                    hasConflicts = true;
                    break;
                }
            }
            
            if (hasConflicts) {
                showNotification('Please resolve time slot conflicts before saving', 'error');
                return;
            }
            
            // Collect feature points
            const featureInputs = document.querySelectorAll('.feature-point-input');
            const features = Array.from(featureInputs)
                .map(input => input.value.trim())
                .filter(feature => feature.length > 0);
            
            if (features.length === 0) {
                showNotification('Please add at least one feature point', 'error');
                return;
            }

            const submitBtn = document.getElementById('membershipSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Format class schedule to readable string
            let classTimeString = null;
            if (Object.keys(classSchedule).length > 0) {
                const scheduleLines = [];
                for (const day in classSchedule) {
                    const slots = classSchedule[day].filter(s => !s.conflict);
                    if (slots.length > 0) {
                        const slotTimes = slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
                        scheduleLines.push(`${day}: ${slotTimes}`);
                    }
                }
                classTimeString = scheduleLines.join(' | ');
            }

            const formData = {
                packageName: document.getElementById('packageName').value.trim(),
                originalPrice: parseInt(document.getElementById('originalPrice').value),
                offeredPrice: parseInt(document.getElementById('offeredPrice').value),
                offerEndsAt: document.getElementById('offerEndsAt').value,
                features: features,
                duration: {
                    startDate: document.getElementById('startDate').value,
                    endDate: document.getElementById('endDate').value
                },
                classTime: classTimeString,
                isMostPopular: document.getElementById('isMostPopular').checked
            };

            try {
                const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api';
                const isEdit = editingMembershipId !== null;
                const url = isEdit 
                    ? `${apiBase}/memberships/update/${editingMembershipId}` 
                    : `${apiBase}/memberships/create`;
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    showNotification(
                        isEdit ? 'Membership updated successfully!' : 'Membership created successfully!', 
                        'success'
                    );
                    closeMembershipModal();
                    loadMemberships();
                } else {
                    showNotification(data.message || 'Error saving membership', 'error');
                }
            } catch (error) {
                console.error('Error saving membership:', error);
                showNotification('Error saving membership', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Membership';
            }
        });
    }
    
    // Add real-time validation event listeners
    const packageNameInput = document.getElementById('packageName');
    if (packageNameInput) {
        let validationTimeout;
        packageNameInput.addEventListener('blur', () => {
            validatePackageName();
        });
        packageNameInput.addEventListener('input', () => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                validatePackageName();
            }, 500); // Debounce validation
        });
    }
    
    const originalPriceInput = document.getElementById('originalPrice');
    const offeredPriceInput = document.getElementById('offeredPrice');
    if (originalPriceInput && offeredPriceInput) {
        originalPriceInput.addEventListener('input', validatePricing);
        offeredPriceInput.addEventListener('input', validatePricing);
    }
});

// Toggle most popular
async function toggleMostPopular(id, currentStatus) {
    try {
        const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api';
        const response = await fetch(`${apiBase}/memberships/toggle-popular/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            loadMemberships();
        } else {
            showNotification(data.message || 'Error updating membership', 'error');
        }
    } catch (error) {
        console.error('Error toggling most popular:', error);
        showNotification('Error updating membership', 'error');
    }
}

// Delete membership
async function deleteMembership(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const apiBase = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api';
        const response = await fetch(`${apiBase}/memberships/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Membership deleted successfully!', 'success');
            loadMemberships();
        } else {
            showNotification(data.message || 'Error deleting membership', 'error');
        }
    } catch (error) {
        console.error('Error deleting membership:', error);
        showNotification('Error deleting membership', 'error');
    }
}

// Show notification function using UI utility
function showNotification(message, type) {
    // Use the UI utility from utils.js
    if (typeof UI !== 'undefined') {
        if (type === 'success') {
            UI.success(message);
        } else if (type === 'error') {
            UI.error(message);
        } else {
            UI.info(message);
        }
    } else {
        // Fallback to alert if UI is not available
        alert(message);
    }
}

// Load memberships when switching to membership section
// This should be called by the main switchSection function
window.loadMembershipsSection = loadMemberships;

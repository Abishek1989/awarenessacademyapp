const API_BASE_URL = (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '/api');

// ===== DYNAMIC FIELD WARNING =====
// Shows (or clears) a single warning per field — replaces any existing one
function showFieldWarning(field, message) {
    const formGroup = field.closest('.form-group');
    const existing = formGroup.querySelector('.field-warning');
    if (existing) existing.remove();
    if (!message) {
        field.classList.remove('error');
        return;
    }
    field.classList.add('error');
    const warnDiv = document.createElement('div');
    warnDiv.className = 'error-message field-warning';
    warnDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(warnDiv);
}

// Live validation — Name
function validateNameLive() {
    const field = document.getElementById('contactName');
    const val = field.value.trim();
    if (val.length === 0) { showFieldWarning(field, null); return; }
    if (/\d/.test(val)) {
        showFieldWarning(field, 'Name cannot contain numbers');
    } else if (!/^[a-zA-Z\s]+$/.test(val)) {
        showFieldWarning(field, 'Name can only contain letters and spaces');
    } else if (val.length < 3) {
        showFieldWarning(field, `At least 3 characters required (${val.length}/3)`);
    } else {
        showFieldWarning(field, null);
    }
}

// Live validation — Phone (auto-strips non-digits, enforces exactly 10 digits)
function validatePhoneLive() {
    const field = document.getElementById('contactPhone');
    // Strip anything that isn't a digit
    const digits = field.value.replace(/\D/g, '').slice(0, 10);
    field.value = digits;
    if (digits.length === 0) { showFieldWarning(field, null); return; }
    if (digits.length < 10) {
        showFieldWarning(field, `${10 - digits.length} more digit${10 - digits.length > 1 ? 's' : ''} needed`);
    } else {
        showFieldWarning(field, null);
    }
}

// Form validation and submission
async function submitContactForm(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    // Get form values
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value.trim();

    // Clear previous errors
    clearErrors();

    // Client-side validation
    let hasError = false;

    // Validate name (min 3 characters, letters and spaces only, no numbers)
    if (!name || name.length < 3) {
        showError('contactName', 'Name must be at least 3 characters');
        hasError = true;
    } else if (/\d/.test(name)) {
        showError('contactName', 'Name cannot contain numbers');
        hasError = true;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        showError('contactName', 'Name can only contain letters and spaces');
        hasError = true;
    }

    // Validate phone (exactly 10 digits)
    if (!phone || !/^\d{10}$/.test(phone)) {
        showError('contactPhone', 'Contact number must be exactly 10 digits');
        hasError = true;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('contactEmail', 'Please enter a valid email address');
        hasError = true;
    }

    // Validate subject
    if (!subject) {
        showError('contactSubject', 'Please select a subject');
        hasError = true;
    }

    // Validate message (10-2000 characters)
    if (!message || message.length < 10) {
        showError('contactMessage', 'Message must be at least 10 characters');
        hasError = true;
    } else if (message.length > 2000) {
        showError('contactMessage', 'Message cannot exceed 2000 characters');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                subject,
                message
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Show success popup
            if (typeof UI !== 'undefined' && UI.createPopup) {
                UI.createPopup({
                    type: 'success',
                    icon: 'check-circle',
                    title: 'Message Sent!',
                    message: 'Thank you for reaching out. We have received your message.\n\nYour message will be evaluated and the related process will be undergone.',
                    confirmText: 'OK'
                });
            } else {
                showSuccessMessage('Message sent successfully!');
            }

            // Reset form
            document.getElementById('contactForm').reset();
            
            // Update character counter
            updateCharCount();
        } else {
            // Show error message
            showErrorMessage(data.message || 'Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Network error. Please check your connection and try again.');
    } finally {
        // Restore button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Add error class
    field.classList.add('error');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    formGroup.appendChild(errorDiv);
}

function clearErrors() {
    // Remove all error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Remove error classes
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-success';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle" style="font-size:1.6rem; margin-right:12px; flex-shrink:0;"></i>
        <div>
            <strong style="font-size:1rem;">Message Sent!</strong>
            <p style="margin:4px 0 6px;">Thank you for reaching out. We have received your message.</p>
            <p style="font-size:0.82rem; opacity:0.8; margin:0; font-style:italic;">
                <i class="fas fa-info-circle" style="margin-right:4px;"></i>
                Your message will be evaluated and the related process will be undergone.
            </p>
        </div>
    `;
    
    const formWrapper = document.querySelector('.form-container');
    if (!formWrapper) return;
    formWrapper.insertBefore(alertDiv, formWrapper.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
    
    // Scroll to top of form
    formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-error';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <div>
            <strong>Error</strong>
            <p>${message}</p>
        </div>
    `;
    
    const formWrapper = document.querySelector('.form-container');
    if (!formWrapper) return;
    formWrapper.insertBefore(alertDiv, formWrapper.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
    
    // Scroll to top of form
    formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Character counter for message field
function updateCharCount() {
    const messageField = document.getElementById('contactMessage');
    const charCount = document.getElementById('charCount');
    
    if (messageField && charCount) {
        const length = messageField.value.length;
        const maxLength = 2000;
        
        charCount.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength) {
            charCount.style.color = '#ef4444';
        } else if (length > maxLength * 0.9) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6b7280';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', submitContactForm);
    }
    
    const messageField = document.getElementById('contactMessage');
    if (messageField) {
        messageField.addEventListener('input', updateCharCount);
        updateCharCount(); // Initial count
    }
    
    // Live validation listeners
    const nameField = document.getElementById('contactName');
    if (nameField) nameField.addEventListener('input', validateNameLive);

    const phoneField = document.getElementById('contactPhone');
    if (phoneField) phoneField.addEventListener('input', validatePhoneLive);

    // Clear errors on input for other fields
    document.querySelectorAll('.form-control').forEach(field => {
        if (field.id === 'contactName' || field.id === 'contactPhone') return;
        field.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                const errorMsg = this.closest('.form-group').querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            }
        });
    });
});

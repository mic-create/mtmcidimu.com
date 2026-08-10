/**
 * MOTHER TERESA MEDICAL CENTRE - APPOINTMENTS CONTROLLER
 * Pure Vanilla JavaScript (ES6+) Implementation
 * --------------------------------------------------------------------------
 * Features:
 * - Interactive multi-step form wizard
 * - Step state validation and summary generation
 * - Dynamic calendar builder & time-slot selection
 * - Mobile navigation menu toggle
 * - Back-to-Top scroll handler and sticky navigation observer
 * - Frontend prototype API submission handler (Ready for Flask integration)
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Global Appointment Form State Object
    const appointmentState = {
        currentStep: 1,
        department: '',
        doctor: '',
        date: '',
        time: '',
        patientDetails: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dob: '',
            gender: '',
            address: '',
            reason: '',
            termsAccepted: false
        }
    };

    // Calendar State
    let currentDate = new Date();
    let selectedCalendarDate = null;

    /* ==========================================================================
       1. DOM Elements Reference
       ========================================================================== */
    const elements = {
        header: document.getElementById('siteHeader'),
        backToTopBtn: document.getElementById('backToTopBtn'),
        mobileToggle: document.getElementById('mobileToggle'),
        mainNav: document.getElementById('mainNav'),
        appointmentForm: document.getElementById('appointmentForm'),
        confirmationPanel: document.getElementById('confirmationPanel'),
        
        // Stepper Navigation
        stepIndicators: document.querySelectorAll('.step-indicator'),
        stepPanels: document.querySelectorAll('.step-panel'),
        btnNextList: document.querySelectorAll('.btn-next'),
        btnPrevList: document.querySelectorAll('.btn-prev'),
        editSelectionsBtn: document.getElementById('editSelectionsBtn'),
        
        // Calendar Elements
        calendarDaysGrid: document.getElementById('calendarDays'),
        calMonthTitle: document.getElementById('calMonthTitle'),
        calPrevBtn: document.getElementById('calPrevMonth'),
        calNextBtn: document.getElementById('calNextMonth'),
        selectedDateDisplay: document.getElementById('selectedDateDisplay'),
        selectedDateInput: document.getElementById('selectedDateInput'),
        
        // Summary Card Elements
        sumDepartment: document.getElementById('sumDepartment'),
        sumDoctor: document.getElementById('sumDoctor'),
        sumDateTime: document.getElementById('sumDateTime'),
        
        // Confirmation View Elements
        confirmRefCode: document.getElementById('confirmRefCode'),
        confirmPatientName: document.getElementById('confirmPatientName'),
        confirmDept: document.getElementById('confirmDept'),
        confirmDoctor: document.getElementById('confirmDoctor'),
        confirmDateTime: document.getElementById('confirmDateTime'),
        addToCalendarBtn: document.getElementById('addToCalendarBtn')
    };

    /* ==========================================================================
       2. Initialization
       ========================================================================== */
    function init() {
        setupNavigationAndScroll();
        setupMultiStepNavigation();
        setupFormInputsListener();
        renderCalendar(currentDate);
        setupCalendarControls();
        setupFormSubmission();
    }

    /* ==========================================================================
       3. Header & Navigation Controls
       ========================================================================== */
    function setupNavigationAndScroll() {
        // Scroll header backdrop effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                elements.header.classList.add('scrolled');
            } else {
                elements.header.classList.remove('scrolled');
            }

            if (window.scrollY > 400) {
                elements.backToTopBtn.classList.add('show');
            } else {
                elements.backToTopBtn.classList.remove('show');
            }
        });

        // Back to top button action
        elements.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Mobile drawer menu toggle
        if (elements.mobileToggle) {
            elements.mobileToggle.addEventListener('click', () => {
                const isExpanded = elements.mobileToggle.getAttribute('aria-expanded') === 'true';
                elements.mobileToggle.setAttribute('aria-expanded', !isExpanded);
                elements.mainNav.classList.toggle('active');
            });
        }
    }

    /* ==========================================================================
       4. Multi-Step Form Stepper Logic
       ========================================================================== */
    function setupMultiStepNavigation() {
        // Next buttons click
        elements.btnNextList.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = parseInt(btn.getAttribute('data-next'), 10);
                if (validateStep(appointmentState.currentStep)) {
                    goToStep(targetStep);
                }
            });
        });

        // Previous buttons click
        elements.btnPrevList.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStep = parseInt(btn.getAttribute('data-prev'), 10);
                goToStep(targetStep);
            });
        });

        // Summary edit button
        if (elements.editSelectionsBtn) {
            elements.editSelectionsBtn.addEventListener('click', () => {
                goToStep(1);
            });
        }

        // Stepper indicator header click
        elements.stepIndicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const requestedStep = parseInt(indicator.getAttribute('data-step'), 10);
                if (requestedStep < appointmentState.currentStep) {
                    goToStep(requestedStep);
                } else if (requestedStep > appointmentState.currentStep) {
                    if (validateStep(appointmentState.currentStep)) {
                        goToStep(requestedStep);
                    }
                }
            });
        });
    }

    function goToStep(stepNumber) {
        appointmentState.currentStep = stepNumber;

        // Update step panels visibility
        elements.stepPanels.forEach(panel => {
            const panelNum = parseInt(panel.getAttribute('data-panel'), 10);
            if (panelNum === stepNumber) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update step indicator header state
        elements.stepIndicators.forEach(indicator => {
            const indStep = parseInt(indicator.getAttribute('data-step'), 10);
            indicator.classList.remove('active', 'completed');
            
            if (indStep === stepNumber) {
                indicator.classList.add('active');
            } else if (indStep < stepNumber) {
                indicator.classList.add('completed');
            }
        });

        // Refresh Summary Card if reaching Step 4
        if (stepNumber === 4) {
            updateSummaryDisplay();
        }

        // Smooth scroll to top of booking portal
        const bookingPortal = document.getElementById('bookingPortal');
        if (bookingPortal) {
            bookingPortal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /* ==========================================================================
       5. Step Validation Rules
       ========================================================================== */
    function validateStep(step) {
        let isValid = true;

        if (step === 1) {
            const selectedDept = elements.appointmentForm.querySelector('input[name="department"]:checked');
            const errorMsg = document.getElementById('step1Error');
            if (!selectedDept) {
                isValid = false;
                errorMsg.style.display = 'block';
            } else {
                appointmentState.department = selectedDept.value;
                errorMsg.style.display = 'none';
            }
        }

        if (step === 2) {
            const selectedDoc = elements.appointmentForm.querySelector('input[name="selected_doctor"]:checked');
            const errorMsg = document.getElementById('step2Error');
            if (!selectedDoc) {
                isValid = false;
                errorMsg.style.display = 'block';
            } else {
                appointmentState.doctor = selectedDoc.value;
                errorMsg.style.display = 'none';
            }
        }

        if (step === 3) {
            const dateVal = elements.selectedDateInput.value;
            const selectedTime = elements.appointmentForm.querySelector('input[name="appointment_time"]:checked');
            const errorMsg = document.getElementById('step3Error');

            if (!dateVal || !selectedTime) {
                isValid = false;
                errorMsg.style.display = 'block';
            } else {
                appointmentState.date = dateVal;
                appointmentState.time = selectedTime.value;
                errorMsg.style.display = 'none';
            }
        }

        return isValid;
    }

    /* ==========================================================================
       6. Form Input & Selection Event Listeners
       ========================================================================== */
    function setupFormInputsListener() {
        // Clear step errors on option select
        elements.appointmentForm.querySelectorAll('input[name="department"]').forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('step1Error').style.display = 'none';
                appointmentState.department = input.value;
            });
        });

        elements.appointmentForm.querySelectorAll('input[name="selected_doctor"]').forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('step2Error').style.display = 'none';
                appointmentState.doctor = input.value;
            });
        });

        elements.appointmentForm.querySelectorAll('input[name="appointment_time"]').forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('step3Error').style.display = 'none';
                appointmentState.time = input.value;
            });
        });
    }

    /* ==========================================================================
       7. Interactive Calendar Component
       ========================================================================== */
    function renderCalendar(date) {
        if (!elements.calendarDaysGrid) return;

        elements.calendarDaysGrid.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        elements.calMonthTitle.textContent = `${monthNames[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Render previous month blank padding cells
        for (let i = 0; i < firstDayIndex; i++) {
            const blankCell = document.createElement('div');
            blankCell.classList.add('cal-day', 'disabled');
            elements.calendarDaysGrid.appendChild(blankCell);
        }

        // Render days of the month
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('cal-day');
            dayCell.textContent = day;

            const cellDate = new Date(year, month, day);

            // Disable past dates and Sundays
            if (cellDate < today || cellDate.getDay() === 0) {
                dayCell.classList.add('disabled');
            } else {
                const formattedDateString = formatDateString(cellDate);

                if (selectedCalendarDate === formattedDateString) {
                    dayCell.classList.add('selected');
                }

                dayCell.addEventListener('click', () => {
                    elements.calendarDaysGrid.querySelectorAll('.cal-day').forEach(cell => cell.classList.remove('selected'));
                    dayCell.classList.add('selected');
                    selectedCalendarDate = formattedDateString;
                    elements.selectedDateInput.value = formattedDateString;
                    elements.selectedDateDisplay.textContent = formattedDateString;
                    document.getElementById('step3Error').style.display = 'none';
                });
            }

            elements.calendarDaysGrid.appendChild(dayCell);
        }
    }

    function setupCalendarControls() {
        if (!elements.calPrevBtn || !elements.calNextBtn) return;

        elements.calPrevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });

        elements.calNextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }

    function formatDateString(dateObj) {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    }

    /* ==========================================================================
       8. Summary Panel Refresh
       ========================================================================== */
    function updateSummaryDisplay() {
        if (elements.sumDepartment) {
            elements.sumDepartment.textContent = appointmentState.department || 'Not selected';
        }
        if (elements.sumDoctor) {
            elements.sumDoctor.textContent = appointmentState.doctor || 'First Available Specialist';
        }
        if (elements.sumDateTime) {
            const d = appointmentState.date || 'No Date Selected';
            const t = appointmentState.time || 'No Time Selected';
            elements.sumDateTime.textContent = `${d} at ${t}`;
        }
    }

    /* ==========================================================================
       9. Patient Details Form Validation & Submission
       ========================================================================== */
    function setupFormSubmission() {
        if (!elements.appointmentForm) return;

        elements.appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validatePatientDetailsForm()) {
                return;
            }

            // Collect Form Inputs
            appointmentState.patientDetails = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('patientEmail').value.trim(),
                phone: document.getElementById('patientPhone').value.trim(),
                dob: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                address: document.getElementById('patientAddress').value.trim(),
                reason: document.getElementById('visitReason').value.trim(),
                termsAccepted: document.getElementById('termsCheck').checked
            };

            const submitBtn = document.getElementById('submitAppointmentBtn');
            setButtonLoadingState(submitBtn, true);

            try {
                // Call API Submission Pipeline
                const response = await submitAppointmentAPI(appointmentState);

                if (response.success) {
                    renderConfirmationScreen(response.referenceCode);
                }
            } catch (error) {
                console.error("Submission Error:", error);
                alert("An error occurred while dispatching your request. Please check your internet connection.");
            } finally {
                setButtonLoadingState(submitBtn, false);
            }
        });
    }

    function validatePatientDetailsForm() {
        let isFormValid = true;

        const inputs = [
            { id: 'firstName', parent: 'form-group' },
            { id: 'lastName', parent: 'form-group' },
            { id: 'patientEmail', parent: 'form-group', validateEmail: true },
            { id: 'patientPhone', parent: 'form-group' },
            { id: 'dob', parent: 'form-group' },
            { id: 'gender', parent: 'form-group' }
        ];

        inputs.forEach(field => {
            const inputEl = document.getElementById(field.id);
            const parentEl = inputEl.closest(`.${field.parent}`);

            if (!inputEl.value.trim()) {
                parentEl.classList.add('has-error');
                isFormValid = false;
            } else if (field.validateEmail && !isValidEmail(inputEl.value)) {
                parentEl.classList.add('has-error');
                isFormValid = false;
            } else {
                parentEl.classList.remove('has-error');
            }
        });

        // Terms Checkbox
        const termsCheck = document.getElementById('termsCheck');
        const termsError = document.getElementById('termsError');
        if (!termsCheck.checked) {
            termsError.style.display = 'block';
            isFormValid = false;
        } else {
            termsError.style.display = 'none';
        }

        return isFormValid;
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function setButtonLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<span>Processing Request...</span>`;
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    }

    /* ==========================================================================
       10. Backend Integration Placeholder Pipeline
       ========================================================================== */
    /**
     * Future API integration point for Flask / Python Backend
     * Endpoint path: POST /api/appointments
     */
    async function submitAppointmentAPI(payload) {
        const API_BASE_URL = 'https://mtmc-backend.onrender.com';

        const requestBody = {
            department: payload.department,
            selected_doctor: payload.doctor,
            appointment_date: payload.date,
            appointment_time: payload.time,

            patientDetails: {
                firstName: payload.patientDetails.firstName,
                lastName: payload.patientDetails.lastName,
                email: payload.patientDetails.email,
                phone: payload.patientDetails.phone,
                dob: payload.patientDetails.dob,
                gender: payload.patientDetails.gender,
                address: payload.patientDetails.address
            },

            reason: payload.patientDetails.reason || 'General Consultation',
            appointment_type: 'In-Person'
        };

        const response = await fetch(
            `${API_BASE_URL}/api/appointments`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'Unable to create appointment.'
            );
        }

        return {
        success: true,

        // Use the real database appointment ID
        referenceCode: `MTMC-${String(result.appointment.id).padStart(6, '0')}`,

        appointment: result.appointment
    };
}

    /* ==========================================================================
       11. Confirmation Screen View
       ========================================================================== */
    function renderConfirmationScreen(refCode) {
        // Hide Form
        elements.appointmentForm.style.display = 'none';
        document.querySelector('.stepper-header').style.display = 'none';

        // Populate Confirmation Details
        elements.confirmRefCode.textContent = refCode;
        elements.confirmPatientName.textContent = `${appointmentState.patientDetails.firstName} ${appointmentState.patientDetails.lastName}`;
        elements.confirmDept.textContent = appointmentState.department;
        elements.confirmDoctor.textContent = appointmentState.doctor;
        elements.confirmDateTime.textContent = `${appointmentState.date} at ${appointmentState.time}`;

        // Show Confirmation Panel
        elements.confirmationPanel.hidden = false;

        // Scroll to Confirmation Box
        elements.confirmationPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add Calendar Event Listener
        if (elements.addToCalendarBtn) {
            elements.addToCalendarBtn.addEventListener('click', () => {
                alert(`Appointment reference ${refCode} added to device calendar.`);
            });
        }
    }

    // Execute application startup
    init();
});
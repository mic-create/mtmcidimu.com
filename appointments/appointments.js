document.addEventListener('DOMContentLoaded', () => {
  // Configured to point directly to your live Node.js / Express backend
  const API_BASE_URL = 'https://mtmc-backend.onrender.com';

  // Wizard Step Tracker
  let currentStep = 1;

  // DOM Elements - Selects
  const departmentSelect = document.getElementById('department-select');
  const doctorSelect = document.getElementById('doctor-select');

  // DOM Elements - Inputs
  const dateInput = document.getElementById('appointment-date');
  const timeSelect = document.getElementById('appointment-time');
  const nameInput = document.getElementById('patient-name');
  const emailInput = document.getElementById('patient-email');
  const phoneInput = document.getElementById('patient-phone');
  const reasonInput = document.getElementById('appointment-reason');

  // Action Buttons
  const btnStep1Next = document.getElementById('btn-step-1-next');
  const btnStep2Prev = document.getElementById('btn-step-2-prev');
  const btnStep2Next = document.getElementById('btn-step-2-next');
  const btnStep3Prev = document.getElementById('btn-step-3-prev');
  const appointmentForm = document.getElementById('appointment-form');

  // Restrict calendar input to present and future dates only
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  /**
   * Safe Data Extractor for API Responses
   * Unpacks result.data when nested by global response wrappers
   */
  const extractData = (res) => (res && res.data) ? res.data : res;

  // 1. Load Departments from Express Backend
  async function loadDepartments() {
    try {
      departmentSelect.innerHTML = '<option value="">-- Loading Departments... --</option>';
      const response = await fetch(`${API_BASE_URL}/api/departments`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      
      const rawResult = await response.json();
      const departments = extractData(rawResult);

      departmentSelect.innerHTML = '<option value="">-- Select Department --</option>';
      if (Array.isArray(departments)) {
        departments.forEach(dept => {
          const opt = document.createElement('option');
          opt.value = dept.id;
          opt.textContent = dept.name;
          departmentSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
      departmentSelect.innerHTML = '<option value="">Failed to load departments</option>';
    }
  }

  // 2. Fetch Doctors dynamically when Department changes
  departmentSelect.addEventListener('change', async (e) => {
    const deptId = e.target.value;

    // Reset doctor selection
    doctorSelect.innerHTML = '<option value="">-- Fetching Doctors... --</option>';
    doctorSelect.disabled = true;
    clearError('department-error', departmentSelect);

    if (!deptId) {
      doctorSelect.innerHTML = '<option value="">-- Select a Department First --</option>';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${deptId}/doctors`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const rawResult = await response.json();
      const doctors = extractData(rawResult);

      if (Array.isArray(doctors) && doctors.length > 0) {
        doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
        doctors.forEach(doc => {
          const opt = document.createElement('option');
          opt.value = doc.id;
          opt.textContent = `Dr. ${doc.name} (${doc.specialty || 'General'})`;
          doctorSelect.appendChild(opt);
        });
        doctorSelect.disabled = false;
      } else {
        doctorSelect.innerHTML = '<option value="">No doctors assigned to this department</option>';
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
      doctorSelect.innerHTML = '<option value="">Error loading doctors</option>';
    }
  });

  doctorSelect.addEventListener('change', () => {
    clearError('doctor-error', doctorSelect);
  });

  // Validation UI Handlers
  function showError(errorId, element) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.style.display = 'block';
    if (element && element.closest('.form-group')) {
      element.closest('.form-group').classList.add('has-error');
    }
  }

  function clearError(errorId, element) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.style.display = 'none';
    if (element && element.closest('.form-group')) {
      element.closest('.form-group').classList.remove('has-error');
    }
  }

  // Wizard Step Navigation System
  function goToStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.wizard-progress .step').forEach((step, idx) => {
      step.classList.remove('active');
      if (idx + 1 < stepNumber) {
        step.classList.add('completed');
      } else {
        step.classList.remove('completed');
      }
    });

    const activeStep = document.getElementById(`wizard-step-${stepNumber}`);
    const activeIndicator = document.getElementById(`step-indicator-${stepNumber}`);
    const progressBarFill = document.getElementById('progress-bar-fill');

    if (activeStep) activeStep.classList.add('active');
    if (activeIndicator) activeIndicator.classList.add('active');
    if (progressBarFill) {
      progressBarFill.style.width = `${((stepNumber - 1) / 3) * 100}%`;
    }

    currentStep = stepNumber;
  }

  // Step 1 Validation
  btnStep1Next.addEventListener('click', () => {
    let isValid = true;

    if (!departmentSelect.value) {
      showError('department-error', departmentSelect);
      isValid = false;
    } else {
      clearError('department-error', departmentSelect);
    }

    if (!doctorSelect.value) {
      showError('doctor-error', doctorSelect);
      isValid = false;
    } else {
      clearError('doctor-error', doctorSelect);
    }

    if (isValid) {
      goToStep(2);
    }
  });

  // Step 2 Validation & Navigation
  btnStep2Prev.addEventListener('click', () => goToStep(1));

  btnStep2Next.addEventListener('click', () => {
    let isValid = true;

    if (!dateInput.value) {
      showError('date-error', dateInput);
      isValid = false;
    } else {
      clearError('date-error', dateInput);
    }

    if (!timeSelect.value) {
      showError('time-error', timeSelect);
      isValid = false;
    } else {
      clearError('time-error', timeSelect);
    }

    if (isValid) {
      goToStep(3);
    }
  });

  // Step 3 Navigation & Final Submission
  btnStep3Prev.addEventListener('click', () => goToStep(2));

  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    // Validate Contact Details
    if (!nameInput.value.trim()) {
      showError('name-error', nameInput);
      isValid = false;
    } else {
      clearError('name-error', nameInput);
    }

    if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
      showError('email-error', emailInput);
      isValid = false;
    } else {
      clearError('email-error', emailInput);
    }

    if (!phoneInput.value.trim()) {
      showError('phone-error', phoneInput);
      isValid = false;
    } else {
      clearError('phone-error', phoneInput);
    }

    // Direct DOM extraction and integer parsing
    const departmentIdNum = parseInt(departmentSelect.value, 10);
    const doctorIdNum = parseInt(doctorSelect.value, 10);

    if (isNaN(departmentIdNum)) {
      showError('department-error', departmentSelect);
      goToStep(1);
      return;
    }

    if (isNaN(doctorIdNum)) {
      showError('doctor-error', doctorSelect);
      goToStep(1);
      return;
    }

    if (!isValid) return;

    // Build Payload for Express / Prisma Endpoint
    const payload = {
      departmentId: departmentIdNum,
      doctorId: doctorIdNum,
      appointmentDate: dateInput.value,
      appointmentTime: timeSelect.value,
      patientName: nameInput.value.trim(),
      patientEmail: emailInput.value.trim(),
      patientPhone: phoneInput.value.trim(),
      reason: reasonInput.value.trim() || undefined
    };

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting Booking...</span>`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawResult = await response.json();

      if (!response.ok) {
        throw new Error(rawResult.message || 'Failed to submit appointment');
      }

      const responseData = extractData(rawResult);

      // Populate Step 4 Confirmation Card
      document.getElementById('summary-ref').textContent = responseData.referenceNumber || responseData.id || 'MTMC-CONFIRMED';
      document.getElementById('summary-dept').textContent = departmentSelect.options[departmentSelect.selectedIndex].text;
      document.getElementById('summary-doctor').textContent = doctorSelect.options[doctorSelect.selectedIndex].text;
      document.getElementById('summary-datetime').textContent = `${dateInput.value} at ${timeSelect.value}`;

      goToStep(4);
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Error submitting appointment: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Confirm & Complete Booking</span>
        <svg class="btn-icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
  });

  // Initial Load
  loadDepartments();
});
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://mtmc-backend.onrender.com';

  // State Management
  let currentStep = 1;
  const appointmentState = {
    departmentId: '',
    departmentName: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: ''
  };

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

  // Navigation Buttons
  const btnStep1Next = document.getElementById('btn-step-1-next');
  const btnStep2Prev = document.getElementById('btn-step-2-prev');
  const btnStep2Next = document.getElementById('btn-step-2-next');
  const btnStep3Prev = document.getElementById('btn-step-3-prev');
  const appointmentForm = document.getElementById('appointment-form');

  // Set min date to today
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Helper: Helper for API responses safely unpacking `data`
  const extractData = (res) => (res && res.data) ? res.data : res;

  // 1. Fetch Departments from Express API
  async function loadDepartments() {
    try {
      departmentSelect.innerHTML = '<option value="">-- Loading Departments... --</option>';
      const response = await fetch(`${API_BASE_URL}/api/departments`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const departments = extractData(result);

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
      console.error('Error fetching departments:', err);
      departmentSelect.innerHTML = '<option value="">Failed to load departments</option>';
    }
  }

  // 2. Fetch Doctors when Department is Selected
  departmentSelect.addEventListener('change', async (e) => {
    const deptId = e.target.value;
    appointmentState.departmentId = deptId;
    appointmentState.departmentName = deptId ? e.target.options[e.target.selectedIndex].text : '';
    
    // Reset doctor selection
    doctorSelect.innerHTML = '<option value="">-- Loading Doctors... --</option>';
    doctorSelect.disabled = true;
    clearError('department-error', departmentSelect);

    if (!deptId) {
      doctorSelect.innerHTML = '<option value="">-- Select a Department First --</option>';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${deptId}/doctors`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const doctors = extractData(result);

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
        doctorSelect.innerHTML = '<option value="">No doctors available in this department</option>';
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      doctorSelect.innerHTML = '<option value="">Failed to load doctors</option>';
    }
  });

  doctorSelect.addEventListener('change', (e) => {
    appointmentState.doctorId = e.target.value;
    appointmentState.doctorName = e.target.value ? e.target.options[e.target.selectedIndex].text : '';
    clearError('doctor-error', doctorSelect);
  });

  // Validation Helpers
  function showError(errorId, element) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.style.display = 'block';
    if (element && element.parentElement) element.parentElement.classList.add('has-error');
  }

  function clearError(errorId, element) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.style.display = 'none';
    if (element && element.parentElement) element.parentElement.classList.remove('has-error');
  }

  // Wizard Step Switching Logic
  function goToStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.wizard-progress .step').forEach(step => step.classList.remove('active'));

    const activeStep = document.getElementById(`wizard-step-${stepNumber}`);
    const activeIndicator = document.getElementById(`step-indicator-${stepNumber}`);

    if (activeStep) activeStep.classList.add('active');
    if (activeIndicator) activeIndicator.classList.add('active');

    currentStep = stepNumber;
  }

  // Step 1 Validation & Next
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
      appointmentState.appointmentDate = dateInput.value;
      appointmentState.appointmentTime = timeSelect.value;
      goToStep(3);
    }
  });

  // Step 3 Navigation & Submission
  btnStep3Prev.addEventListener('click', () => goToStep(2));

  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

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

    if (!isValid) return;

    // Build Payload for Express / Prisma endpoint
    const payload = {
      departmentId: parseInt(appointmentState.departmentId, 10),
      doctorId: parseInt(appointmentState.doctorId, 10),
      appointmentDate: appointmentState.appointmentDate,
      appointmentTime: appointmentState.appointmentTime,
      patientName: nameInput.value.trim(),
      patientEmail: emailInput.value.trim(),
      patientPhone: phoneInput.value.trim(),
      reason: reasonInput.value.trim() || undefined
    };

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit appointment');
      }

      const responseData = extractData(result);

      // Populate Summary on Step 4
      document.getElementById('summary-ref').textContent = responseData.referenceNumber || responseData.id || 'CONFIRMED';
      document.getElementById('summary-dept').textContent = appointmentState.departmentName;
      document.getElementById('summary-doctor').textContent = appointmentState.doctorName;
      document.getElementById('summary-datetime').textContent = `${appointmentState.appointmentDate} at ${appointmentState.appointmentTime}`;

      goToStep(4);
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Error submitting appointment: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
    }
  });

  // Initial load execution
  loadDepartments();
});
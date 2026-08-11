document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://mtmc-backend.onrender.com';

  let currentStep = 1;

  // DOM Elements - Selects
  const departmentSelect = document.getElementById('department-select');
  const doctorSelect = document.getElementById('doctor-select');

  // DOM Containers for Luxury Cards
  const departmentGrid = document.getElementById('department-grid');
  const doctorDirectory = document.getElementById('doctor-directory');

  // DOM Inputs
  const dateInput = document.getElementById('appointment-date');
  const timeSelect = document.getElementById('appointment-time');
  const nameInput = document.getElementById('patient-name');
  const emailInput = document.getElementById('patient-email');
  const phoneInput = document.getElementById('patient-phone');
  const reasonInput = document.getElementById('appointment-reason');

  // Buttons
  const btnStep1Next = document.getElementById('btn-step-1-next');
  const btnStep2Prev = document.getElementById('btn-step-2-prev');
  const btnStep2Next = document.getElementById('btn-step-2-next');
  const btnStep3Prev = document.getElementById('btn-step-3-prev');
  const btnStep3Next = document.getElementById('btn-step-3-next');
  const btnStep4Prev = document.getElementById('btn-step-4-prev');
  const appointmentForm = document.getElementById('appointment-form');

  // Restrict calendar input to present and future dates
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  const extractData = (res) => (res && res.data) ? res.data : res;

  // 1. Load Departments and Render Cards
  async function loadDepartments() {
    try {
      departmentGrid.innerHTML = '<div class="loading-placeholder">Loading available specialties...</div>';
      const response = await fetch(`${API_BASE_URL}/api/departments`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const rawResult = await response.json();
      const departments = extractData(rawResult);

      departmentSelect.innerHTML = '<option value="">-- Select Department --</option>';
      departmentGrid.innerHTML = '';

      if (Array.isArray(departments) && departments.length > 0) {
        departments.forEach(dept => {
          const deptVal = dept.id || dept.name;

          // Native Select Option
          const opt = document.createElement('option');
          opt.value = deptVal;
          opt.textContent = dept.name;
          departmentSelect.appendChild(opt);

          // Luxury Card
          const card = document.createElement('div');
          card.className = 'dept-card';
          card.dataset.value = deptVal;
          card.innerHTML = `
            <div class="dept-card-title">${dept.name}</div>
            <div class="dept-card-desc">${dept.description || 'Specialized clinical care & medical consultations.'}</div>
          `;

          card.addEventListener('click', () => {
            document.querySelectorAll('.dept-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            departmentSelect.value = deptVal;
            departmentSelect.dispatchEvent(new Event('change'));
          });

          departmentGrid.appendChild(card);
        });
      } else {
        departmentGrid.innerHTML = '<div class="loading-placeholder">No departments currently available.</div>';
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
      departmentGrid.innerHTML = '<div class="loading-placeholder">Unable to load departments. Please try again later.</div>';
    }
  }

  // 2. Load Doctors based on selected Department
  departmentSelect.addEventListener('change', async (e) => {
    const deptId = e.target.value;

    doctorDirectory.innerHTML = '<div class="loading-placeholder">Fetching available specialists...</div>';
    doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
    doctorSelect.disabled = true;
    clearError('department-error', departmentSelect);

    if (!deptId) {
      doctorDirectory.innerHTML = '<div class="loading-placeholder">Please select a department first.</div>';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${deptId}/doctors`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const rawResult = await response.json();
      const doctors = extractData(rawResult);

      doctorDirectory.innerHTML = '';

      if (Array.isArray(doctors) && doctors.length > 0) {
        doctors.forEach(doc => {
          const docVal = doc.id || doc.name;

          // Native Select Option
          const opt = document.createElement('option');
          opt.value = docVal;
          opt.textContent = `Dr. ${doc.name}`;
          doctorSelect.appendChild(opt);

          // Get Initials
          const initials = doc.name ? doc.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'MD';

          // Luxury Specialist Card
          const card = document.createElement('div');
          card.className = 'doc-card';
          card.dataset.value = docVal;
          card.innerHTML = `
            <div class="doc-avatar">${initials}</div>
            <div class="doc-info">
              <h4>Dr. ${doc.name}</h4>
              <p>${doc.specialty || 'Consultant Specialist'}</p>
            </div>
          `;

          card.addEventListener('click', () => {
            document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            doctorSelect.value = docVal;
            doctorSelect.dispatchEvent(new Event('change'));
          });

          doctorDirectory.appendChild(card);
        });
        doctorSelect.disabled = false;
      } else {
        doctorDirectory.innerHTML = '<div class="loading-placeholder">No physicians assigned to this department.</div>';
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
      doctorDirectory.innerHTML = '<div class="loading-placeholder">Error retrieving doctor directory.</div>';
    }
  });

  doctorSelect.addEventListener('change', () => {
    clearError('doctor-error', doctorSelect);
  });

  // UI Error helpers
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

  // Real-Time Preview Updates
  function updateSummaryPreview() {
    const pDept = document.getElementById('preview-dept');
    const pDoc = document.getElementById('preview-doctor');
    const pDate = document.getElementById('preview-date');
    const pTime = document.getElementById('preview-time');

    if (pDept) pDept.textContent = departmentSelect.value ? departmentSelect.options[departmentSelect.selectedIndex].text : '---';
    if (pDoc) pDoc.textContent = doctorSelect.value ? doctorSelect.options[doctorSelect.selectedIndex].text : '---';
    if (pDate) pDate.textContent = dateInput.value || '---';
    if (pTime) pTime.textContent = timeSelect.value || '---';
  }

  // Stepper Transition Engine
  function goToStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.wizard-stepper .step-node').forEach((node, idx) => {
      node.classList.remove('active');
      if (idx + 1 < stepNumber) {
        node.classList.add('completed');
      } else {
        node.classList.remove('completed');
      }
    });

    const activeStep = document.getElementById(`wizard-step-${stepNumber}`);
    const activeNode = document.getElementById(`step-node-${stepNumber}`);
    const progressLine = document.getElementById('stepper-progress-line');

    if (activeStep) activeStep.classList.add('active');
    if (activeNode) activeNode.classList.add('active');
    if (progressLine) {
      progressLine.style.width = `${((stepNumber - 1) / 3) * 100}%`;
    }

    if (stepNumber === 4) {
      updateSummaryPreview();
    }

    currentStep = stepNumber;
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }

  // Step 1 Navigation
  btnStep1Next.addEventListener('click', () => {
    if (!departmentSelect.value) {
      showError('department-error', departmentSelect);
      return;
    }
    clearError('department-error', departmentSelect);
    goToStep(2);
  });

  // Step 2 Navigation
  btnStep2Prev.addEventListener('click', () => goToStep(1));
  btnStep2Next.addEventListener('click', () => {
    if (!doctorSelect.value) {
      showError('doctor-error', doctorSelect);
      return;
    }
    clearError('doctor-error', doctorSelect);
    goToStep(3);
  });

  // Step 3 Navigation
  btnStep3Prev.addEventListener('click', () => goToStep(2));
  btnStep3Next.addEventListener('click', () => {
    let isValid = true;
    if (!dateInput.value) { showError('date-error', dateInput); isValid = false; }
    else { clearError('date-error', dateInput); }

    if (!timeSelect.value) { showError('time-error', timeSelect); isValid = false; }
    else { clearError('time-error', timeSelect); }

    if (isValid) goToStep(4);
  });

  // Step 4 Navigation
  btnStep4Prev.addEventListener('click', () => goToStep(3));

  // Form Submission
  appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    const fullNameRaw = nameInput.value.trim();

    if (!fullNameRaw) { showError('name-error', nameInput); isValid = false; }
    else { clearError('name-error', nameInput); }

    if (!emailInput.value.trim() || !emailInput.value.includes('@')) { showError('email-error', emailInput); isValid = false; }
    else { clearError('email-error', emailInput); }

    if (!phoneInput.value.trim()) { showError('phone-error', phoneInput); isValid = false; }
    else { clearError('phone-error', phoneInput); }

    if (!departmentSelect.value) { showError('department-error', departmentSelect); goToStep(1); return; }
    if (!doctorSelect.value) { showError('doctor-error', doctorSelect); goToStep(2); return; }

    if (!isValid) return;

    // Split Full Name safely
    const nameParts = fullNameRaw.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Payload mapped for all variants expected by Express / Prisma
    const requestBody = {
      department: departmentSelect.value,
      department_id: departmentSelect.value,
      selected_doctor: doctorSelect.value,
      doctor_id: doctorSelect.value,
      appointment_date: dateInput.value,
      appointment_time: timeSelect.value,
      patientDetails: {
        first_name: firstName,
        last_name: lastName,
        firstName: firstName,
        lastName: lastName,
        fullName: fullNameRaw,
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
      },
      first_name: firstName,
      last_name: lastName,
      patient_name: fullNameRaw,
      patient_email: emailInput.value.trim(),
      patient_phone: phoneInput.value.trim(),
      reason: reasonInput.value.trim() || "General Consultation",
      appointment_type: "In-Person"
    };

    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Processing Booking...</span>`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const rawResult = await response.json();

      if (!response.ok) {
        throw new Error(rawResult.message || 'Failed to complete appointment registration');
      }

      const responseData = extractData(rawResult);

      // Populate Confirmation Screen
      document.getElementById('summary-ref').textContent = `REF: ${responseData.referenceNumber || responseData.reference_number || responseData.id || 'MTMC-CONFIRMED'}`;
      document.getElementById('summary-patient').textContent = fullNameRaw;
      document.getElementById('summary-dept').textContent = departmentSelect.options[departmentSelect.selectedIndex].text;
      document.getElementById('summary-doctor').textContent = doctorSelect.options[doctorSelect.selectedIndex].text;
      document.getElementById('summary-datetime').textContent = `${dateInput.value} at ${timeSelect.value}`;

      goToStep(5);
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Error completing booking: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Confirm & Reserve Appointment</span>`;
    }
  });

  // Initial Execution
  loadDepartments();
});
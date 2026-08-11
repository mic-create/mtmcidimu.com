/**
 * Mother Teresa Medical Centre (MTMC) - Appointment System Controller
 * Handles multi-step form navigation, validation, doctor/department fetching,
 * and API booking submission to the Node.js / Express backend.
 */

// ============================================================================
// CONFIGURATION & STATE MANAGEMENT
// ============================================================================

// Replace this placeholder with your live Render backend URL in production
const API_BASE_URL = 'https://[INSERT MY ACTUAL RENDER BACKEND URL HERE]';

const appointmentState = {
  currentStep: 1,
  departments: [],
  doctors: [],
  selectedDepartment: null,
  selectedDoctor: null,
  selectedDate: null,
  selectedTime: null,
  patientDetails: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    reason: ''
  },
  isSubmitting: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initAppointmentWizard();
  fetchDepartments();
});

function initAppointmentWizard() {
  setupNavigationButtons();
  setupFormListeners();
  setupDateAndTimePickers();
  renderStep(appointmentState.currentStep);
}

// ============================================================================
// API INTEGRATION - DEPARTMENTS & DOCTORS
// ============================================================================

/**
 * Fetches active departments from the backend API.
 */
async function fetchDepartments() {
  const deptSelect = document.getElementById('department-select');
  if (!deptSelect) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/departments`);
    if (!response.ok) throw new Error('Failed to load departments');
    
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      appointmentState.departments = result.data;
      populateDepartmentDropdown(result.data);
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    showErrorMessage('Unable to load departments. Please refresh the page or try again later.');
  }
}

/**
 * Fetches active doctors belonging to a specific department.
 */
async function fetchDoctorsByDepartment(departmentId) {
  const doctorSelect = document.getElementById('doctor-select');
  if (!doctorSelect) return;

  doctorSelect.disabled = true;
  doctorSelect.innerHTML = '<option value="">Loading doctors...</option>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/departments/${departmentId}/doctors`);
    if (!response.ok) {
      if (response.status === 404) {
        doctorSelect.innerHTML = '<option value="">No doctors available for this department</option>';
        return;
      }
      throw new Error('Failed to load doctors');
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      appointmentState.doctors = result.data;
      populateDoctorDropdown(result.data);
    } else {
      doctorSelect.innerHTML = '<option value="">No doctors available</option>';
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    doctorSelect.innerHTML = '<option value="">Error loading doctors</option>';
    showErrorMessage('Unable to load doctors for the selected department.');
  } finally {
    doctorSelect.disabled = false;
  }
}

// ============================================================================
// UI DROPDOWN HELPERS
// ============================================================================

function populateDepartmentDropdown(departments) {
  const deptSelect = document.getElementById('department-select');
  if (!deptSelect) return;

  deptSelect.innerHTML = '<option value="">Select a Department</option>';
  departments.forEach((dept) => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    deptSelect.appendChild(option);
  });
}

function populateDoctorDropdown(doctors) {
  const doctorSelect = document.getElementById('doctor-select');
  if (!doctorSelect) return;

  if (doctors.length === 0) {
    doctorSelect.innerHTML = '<option value="">No doctors available in this department</option>';
    return;
  }

  doctorSelect.innerHTML = '<option value="">Select a Doctor</option>';
  doctors.forEach((doc) => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `${doc.name} (${doc.specialty})`;
    doctorSelect.appendChild(option);
  });
}

// ============================================================================
// EVENT LISTENERS & FORM BINDING
// ============================================================================

function setupFormListeners() {
  const deptSelect = document.getElementById('department-select');
  const doctorSelect = document.getElementById('doctor-select');

  if (deptSelect) {
    deptSelect.addEventListener('change', (e) => {
      const deptId = parseInt(e.target.value, 10);
      appointmentState.selectedDepartment = deptId || null;
      appointmentState.selectedDoctor = null;
      appointmentState.doctors = [];

      if (deptId) {
        fetchDoctorsByDepartment(deptId);
      } else if (doctorSelect) {
        doctorSelect.innerHTML = '<option value="">Select a Department First</option>';
        doctorSelect.disabled = true;
      }
    });
  }

  if (doctorSelect) {
    doctorSelect.addEventListener('change', (e) => {
      const docId = parseInt(e.target.value, 10);
      appointmentState.selectedDoctor = docId || null;
    });
  }

  const appointmentForm = document.getElementById('appointment-form');
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', handleFormSubmit);
  }
}

function setupDateAndTimePickers() {
  const dateInput = document.getElementById('appointment-date');
  const timeInput = document.getElementById('appointment-time');

  if (dateInput) {
    // Restrict date picker to today or future dates
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', todayStr);

    dateInput.addEventListener('change', (e) => {
      // Preserve raw YYYY-MM-DD calendar string without Date object conversion
      appointmentState.selectedDate = e.target.value;
    });
  }

  if (timeInput) {
    timeInput.addEventListener('change', (e) => {
      appointmentState.selectedTime = e.target.value;
    });
  }
}

function capturePatientInput() {
  appointmentState.patientDetails = {
    firstName: document.getElementById('patient-first-name')?.value.trim() || '',
    lastName: document.getElementById('patient-last-name')?.value.trim() || '',
    email: document.getElementById('patient-email')?.value.trim() || '',
    phone: document.getElementById('patient-phone')?.value.trim() || '',
    dob: document.getElementById('patient-dob')?.value || '',
    gender: document.getElementById('patient-gender')?.value || '',
    address: document.getElementById('patient-address')?.value.trim() || '',
    reason: document.getElementById('appointment-reason')?.value.trim() || 'General Consultation'
  };
}

// ============================================================================
// WIZARD NAVIGATION & VALIDATION
// ============================================================================

function setupNavigationButtons() {
  const nextBtn = document.getElementById('btn-next');
  const prevBtn = document.getElementById('btn-prev');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        if (appointmentState.currentStep < 3) {
          appointmentState.currentStep++;
          renderStep(appointmentState.currentStep);
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (appointmentState.currentStep > 1) {
        appointmentState.currentStep--;
        renderStep(appointmentState.currentStep);
      }
    });
  }
}

function validateCurrentStep() {
  hideErrorMessage();

  if (appointmentState.currentStep === 1) {
    if (!appointmentState.selectedDepartment) {
      showErrorMessage('Please select a medical department.');
      return false;
    }
    if (!appointmentState.selectedDoctor) {
      showErrorMessage('Please select a doctor.');
      return false;
    }
    if (!appointmentState.selectedDate) {
      showErrorMessage('Please select an appointment date.');
      return false;
    }
    if (!appointmentState.selectedTime) {
      showErrorMessage('Please select an appointment time slot.');
      return false;
    }
  }

  if (appointmentState.currentStep === 2) {
    capturePatientInput();
    const p = appointmentState.patientDetails;

    if (!p.firstName) {
      showErrorMessage('Please enter the patient\'s first name.');
      return false;
    }
    if (!p.lastName) {
      showErrorMessage('Please enter the patient\'s last name.');
      return false;
    }
    if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
      showErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!p.phone || p.phone.length < 7) {
      showErrorMessage('Please enter a valid phone number.');
      return false;
    }
  }

  return true;
}

function renderStep(stepNumber) {
  const step1El = document.getElementById('step-1');
  const step2El = document.getElementById('step-2');
  const step3El = document.getElementById('step-3');

  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  if (step1El) step1El.style.display = stepNumber === 1 ? 'block' : 'none';
  if (step2El) step2El.style.display = stepNumber === 2 ? 'block' : 'none';
  if (step3El) step3El.style.display = stepNumber === 3 ? 'block' : 'none';

  if (prevBtn) prevBtn.style.display = stepNumber > 1 ? 'inline-block' : 'none';
  if (nextBtn) nextBtn.style.display = stepNumber < 3 ? 'inline-block' : 'none';
  if (submitBtn) submitBtn.style.display = stepNumber === 3 ? 'inline-block' : 'none';

  updateStepIndicators(stepNumber);

  if (stepNumber === 3) {
    renderSummaryReview();
  }
}

function updateStepIndicators(stepNumber) {
  const indicators = document.querySelectorAll('.wizard-step');
  indicators.forEach((ind, idx) => {
    if (idx + 1 === stepNumber) {
      ind.classList.add('active');
    } else if (idx + 1 < stepNumber) {
      ind.classList.add('completed');
      ind.classList.remove('active');
    } else {
      ind.classList.remove('active', 'completed');
    }
  });
}

function renderSummaryReview() {
  capturePatientInput();

  const selectedDeptObj = appointmentState.departments.find(
    (d) => d.id === appointmentState.selectedDepartment
  );
  const selectedDocObj = appointmentState.doctors.find(
    (d) => d.id === appointmentState.selectedDoctor
  );

  const reviewDept = document.getElementById('review-department');
  const reviewDoc = document.getElementById('review-doctor');
  const reviewDate = document.getElementById('review-date');
  const reviewTime = document.getElementById('review-time');
  const reviewName = document.getElementById('review-patient-name');
  const reviewContact = document.getElementById('review-patient-contact');

  if (reviewDept) reviewDept.textContent = selectedDeptObj ? selectedDeptObj.name : '-';
  if (reviewDoc) reviewDoc.textContent = selectedDocObj ? selectedDocObj.name : '-';
  if (reviewDate) reviewDate.textContent = appointmentState.selectedDate || '-';
  if (reviewTime) reviewTime.textContent = appointmentState.selectedTime || '-';
  if (reviewName) reviewName.textContent = `${appointmentState.patientDetails.firstName} ${appointmentState.patientDetails.lastName}`;
  if (reviewContact) reviewContact.textContent = `${appointmentState.patientDetails.email} | ${appointmentState.patientDetails.phone}`;
}

// ============================================================================
// API SUBMISSION & RESPONSE HANDLING
// ============================================================================

async function handleFormSubmit(e) {
  e.preventDefault();

  if (appointmentState.isSubmitting) return;

  if (!validateCurrentStep()) return;

  capturePatientInput();

  // Construct payload adhering strictly to backend specification
  const payload = {
    department: appointmentState.selectedDepartment,
    selected_doctor: appointmentState.selectedDoctor,
    // Preserve strict calendar string (YYYY-MM-DD) without timezone shifts
    appointment_date: appointmentState.selectedDate,
    appointment_time: appointmentState.selectedTime,
    patientDetails: {
      firstName: appointmentState.patientDetails.firstName,
      lastName: appointmentState.patientDetails.lastName,
      email: appointmentState.patientDetails.email,
      phone: appointmentState.patientDetails.phone,
      dob: appointmentState.patientDetails.dob || null,
      gender: appointmentState.patientDetails.gender || null,
      address: appointmentState.patientDetails.address || null
    },
    reason: appointmentState.patientDetails.reason || 'General Consultation',
    appointment_type: 'In-Person'
  };

  setSubmittingState(true);
  hideErrorMessage();

  try {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let result = null;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    }

    if (!response.ok) {
      // Display specific backend API error message if available
      if (result && result.message) {
        showErrorMessage(result.message);
      } else {
        showErrorMessage(`Server returned error status ${response.status}. Please try again.`);
      }
      return;
    }

    // Successful booking response handling
    if (result && result.success && result.appointment) {
      showConfirmationScreen(result.appointment);
    } else {
      showErrorMessage('An unexpected response was received from the server. Please contact support.');
    }
  } catch (error) {
    console.error('Network or fetch execution error:', error);
    // Separate network-level errors from application API errors
    showErrorMessage('Unable to reach the server. Please check your internet connection and try again.');
  } finally {
    setSubmittingState(false);
  }
}

// ============================================================================
// CONFIRMATION SCREEN DISPLAY
// ============================================================================

function showConfirmationScreen(appointmentData) {
  const wizardContainer = document.getElementById('wizard-container');
  const confirmationContainer = document.getElementById('confirmation-container');

  if (wizardContainer) wizardContainer.style.display = 'none';
  if (confirmationContainer) confirmationContainer.style.display = 'block';

  // Format reference ID as MTMC-00000X
  const numericId = appointmentData.id;
  const formattedRef = `MTMC-${String(numericId).padStart(6, '0')}`;

  const confRef = document.getElementById('conf-reference');
  const confName = document.getElementById('conf-patient-name');
  const confDept = document.getElementById('conf-department');
  const confDoc = document.getElementById('conf-doctor');
  const confDate = document.getElementById('conf-date');
  const confTime = document.getElementById('conf-time');

  if (confRef) confRef.textContent = formattedRef;
  if (confName) confName.textContent = `${appointmentState.patientDetails.firstName} ${appointmentState.patientDetails.lastName}`;
  if (confDept) confDept.textContent = appointmentData.department_name || '-';
  if (confDoc) confDoc.textContent = appointmentData.doctor_name || '-';
  if (confDate) confDate.textContent = appointmentData.date || appointmentState.selectedDate;
  if (confTime) confTime.textContent = appointmentData.time || appointmentState.selectedTime;

  // Scroll smoothly to top of confirmation area
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// STATE HELPERS & UI MESSAGING
// ============================================================================

function setSubmittingState(isSubmitting) {
  appointmentState.isSubmitting = isSubmitting;
  const submitBtn = document.getElementById('btn-submit');
  const prevBtn = document.getElementById('btn-prev');

  if (submitBtn) {
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? 'Booking Appointment...' : 'Confirm & Book Appointment';
  }
  if (prevBtn) {
    prevBtn.disabled = isSubmitting;
  }
}

function showErrorMessage(message) {
  const errorBox = document.getElementById('error-message-box');
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    alert(message);
  }
}

function hideErrorMessage() {
  const errorBox = document.getElementById('error-message-box');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }
}
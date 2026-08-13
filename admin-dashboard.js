const API_BASE = 'https://mtmc-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('mtmc_jwt_token');
  const user = JSON.parse(localStorage.getItem('mtmc_user_info') || '{}');

  if (!token) {
    console.warn('No JWT token found in localStorage. Redirecting to login.');
    window.location.href = 'admin-login.html';
    return;
  }

  if (user.email) {
    const emailDisplay = document.getElementById('adminEmailDisplay');
    const avatarBadge = document.getElementById('avatarBadge');
    if (emailDisplay) emailDisplay.innerText = user.email;
    if (avatarBadge) avatarBadge.innerText = user.email.charAt(0).toUpperCase();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  fetchDashboardMetrics();
  fetchRecentAppointments();
});

function handleLogout() {
  localStorage.removeItem('mtmc_jwt_token');
  localStorage.removeItem('mtmc_user_info');
  window.location.href = 'admin-login.html';
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('mtmc_jwt_token');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const url = `${API_BASE}${endpoint}`;
  console.log(`[API Call] Requesting: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    console.error(`Authentication failed (${response.status}) for ${endpoint}`);
    handleLogout();
    throw new Error(`Auth Error ${response.status}: Access unauthorized or token expired.`);
  }

  return response;
}

// Fetch dashboard telemetry metrics
async function fetchDashboardMetrics() {
  try {
    const res = await fetchWithAuth('/admin/stats');
    
    if (!res.ok) {
      console.error(`[/admin/stats] Failed with status: ${res.status}`);
      return;
    }

    const json = await res.json();
    console.log('[/admin/stats] Payload Received:', json);

    const s = json.stats || json.data || json;

    setElementText('statTotalAppointments', s.totalAppointments ?? s.appointmentsCount ?? s.total_appointments ?? 0);
    setElementText('statPendingAppointments', s.pendingAppointments ?? s.pendingCount ?? s.pending_appointments ?? 0);
    setElementText('statTodayAppointments', s.todayAppointments ?? s.todayCount ?? s.today_appointments ?? 0);
    setElementText('statTotalPatients', s.totalPatients ?? s.patientsCount ?? s.total_patients ?? 0);
    setElementText('statTotalDoctors', s.totalDoctors ?? s.doctorsCount ?? s.total_doctors ?? 0);
    setElementText('statTotalDepartments', s.totalDepartments ?? s.departmentsCount ?? s.total_departments ?? 0);

  } catch (error) {
    console.error('Error fetching /admin/stats:', error.message);
  }
}

// Fetch and render appointments
async function fetchRecentAppointments() {
  const tbody = document.getElementById('recentAppointmentsBody');
  const todayContainer = document.getElementById('todayScheduleContainer');

  if (!tbody) return;

  try {
    const res = await fetchWithAuth('/appointments');

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[/appointments] API Error ${res.status}:`, errText);
      tbody.innerHTML = `<tr><td colspan="7" class="table-loader" style="color:#DC2626;">API Error ${res.status}: ${res.statusText}</td></tr>`;
      return;
    }

    const data = await res.json();
    console.log('[/appointments] Payload Received:', data);

    const appointments = data.appointments || data.data || (Array.isArray(data) ? data : []);

    if (!appointments || appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No appointment records registered in database.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    if (todayContainer) todayContainer.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];
    let hasTodaySchedule = false;

    appointments.forEach((apt) => {
      // 1. Patient Name Extraction
      const patientName = apt.patientName || apt.patient_name || 
        (apt.firstName ? `${apt.firstName} ${apt.lastName || ''}`.trim() : null) ||
        (apt.patient ? (apt.patient.name || `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim()) : null) || 
        'Anonymous Patient';

      // 2. Doctor Name Extraction
      let rawDoctor = apt.doctor ? (apt.doctor.name || apt.doctor.fullName || '') : (apt.doctorName || 'Unassigned');
      const doctorName = rawDoctor.startsWith('Dr.') ? rawDoctor : `Dr. ${rawDoctor}`;

      // 3. Department Name Extraction
      const deptName = apt.department ? (apt.department.name || apt.department) : (apt.departmentName || 'General Practice');
      
      const rawDate = apt.appointmentDate || apt.date || apt.createdAt || '';
      const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';
      const timeSlot = apt.appointmentTime || apt.time || apt.timeSlot || 'N/A';
      const status = (apt.status || 'PENDING').toUpperCase();

      // Status Badge Style
      let badgeClass = 'badge-pending';
      if (status === 'CONFIRMED') badgeClass = 'badge-confirmed';
      if (status === 'COMPLETED') badgeClass = 'badge-completed';
      if (status === 'CANCELLED') badgeClass = 'badge-cancelled';

      const statusBadge = `<span class="badge ${badgeClass}">${status}</span>`;

      const safePatient = escapeHtml(patientName);
      const safeDoctor = escapeHtml(doctorName);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${safePatient}</strong></td>
        <td>${safeDoctor}</td>
        <td>${deptName}</td>
        <td>${formattedDate}</td>
        <td>${timeSlot}</td>
        <td>${statusBadge}</td>
        <td>
          <button 
            onclick="openManageModal('${apt.id}', '${safePatient}', '${safeDoctor}', '${status}')"
            style="border:1px solid #E5E7EB; background:#FFFFFF; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:600; color:#0B192C;">
            Manage
          </button>
        </td>
      `;
      tbody.appendChild(row);

      // Today's schedule panel check
      if (todayContainer && rawDate.startsWith(todayStr)) {
        hasTodaySchedule = true;
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.innerHTML = `
          <div class="schedule-time">${timeSlot}</div>
          <div class="schedule-patient">${safePatient}</div>
          <div class="schedule-doctor">${safeDoctor} (${deptName})</div>
        `;
        todayContainer.appendChild(item);
      }
    });

    if (todayContainer && !hasTodaySchedule) {
      todayContainer.innerHTML = '<p class="empty-state">No appointments scheduled for today.</p>';
    }

  } catch (error) {
    console.error('Failed to load appointments:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="table-loader" style="color:#DC2626;">Network/Fetch Error: ${error.message}</td></tr>`;
  }
}

window.openManageModal = function(id, patient, doctor, status) {
  document.getElementById('modalAppointmentId').value = id;
  document.getElementById('modalPatientName').innerText = patient;
  document.getElementById('modalDoctorName').innerText = doctor;
  document.getElementById('modalStatusSelect').value = status;
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('manageModal').style.display = 'flex';
};

window.closeManageModal = function() {
  document.getElementById('manageModal').style.display = 'none';
};

window.submitStatusUpdate = async function() {
  const id = document.getElementById('modalAppointmentId').value;
  const newStatus = document.getElementById('modalStatusSelect').value;
  const errorEl = document.getElementById('modalError');
  const saveBtn = document.getElementById('saveStatusBtn');

  errorEl.style.display = 'none';
  saveBtn.disabled = true;
  saveBtn.innerText = 'Updating Record...';

  try {
    const res = await fetchWithAuth(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (res.ok && (data.success || data.data || data.id)) {
      closeManageModal();
      await fetchRecentAppointments();
      await fetchDashboardMetrics();
    } else {
      let errorMessage = data.message || data.error || `HTTP ${res.status} error occurred`;
      
      if (res.status === 400) {
        errorMessage = `Validation Error (400): ${errorMessage}`;
      } else if (res.status === 404) {
        errorMessage = `Not Found (404): ${errorMessage}`;
      } else if (res.status >= 500) {
        errorMessage = `Server Error (${res.status}): ${errorMessage}`;
      }

      errorEl.innerText = errorMessage;
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Update Request Error:', err);
    errorEl.innerText = err.message || 'Network error communicating with live backend.';
    errorEl.style.display = 'block';
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = 'Save Update';
  }
};

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function escapeHtml(str) {
  return String(str)
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}
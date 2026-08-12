const API_BASE = 'https://mtmc-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('mtmc_jwt_token');
  const user = JSON.parse(localStorage.getItem('mtmc_user_info') || '{}');

  // 1. Guard check
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Setup user header
  if (user.email) {
    const emailDisplay = document.getElementById('adminEmailDisplay');
    const avatarBadge = document.getElementById('avatarBadge');
    if (emailDisplay) emailDisplay.innerText = user.email;
    if (avatarBadge) avatarBadge.innerText = user.email.charAt(0).toUpperCase();
  }

  // 3. Event listeners
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // 4. Initial telemetry load
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    handleLogout();
    throw new Error('Unauthorized or expired session.');
  }

  return response;
}

// Fetch dashboard telemetry metrics
async function fetchDashboardMetrics() {
  try {
    const res = await fetchWithAuth('/admin/stats');
    const data = await res.json();
    
    const stats = data.stats || data.data || data;

    if (data.success !== false) {
      setElementText('statTotalAppointments', stats.totalAppointments ?? stats.appointmentsCount ?? '--');
      setElementText('statPendingAppointments', stats.pendingAppointments ?? stats.pendingCount ?? '--');
      setElementText('statTodayAppointments', stats.todayAppointments ?? stats.todayCount ?? '--');
      setElementText('statTotalPatients', stats.totalPatients ?? stats.patientsCount ?? '--');
      setElementText('statTotalDoctors', stats.totalDoctors ?? stats.doctorsCount ?? '--');
      setElementText('statTotalDepartments', stats.totalDepartments ?? stats.departmentsCount ?? '--');
    }
  } catch (error) {
    console.error('Failed to fetch operational stats:', error);
  }
}

// Fetch and render appointments
async function fetchRecentAppointments() {
  const tbody = document.getElementById('recentAppointmentsBody');
  const todayContainer = document.getElementById('todayScheduleContainer');

  if (!tbody) return;

  try {
    const res = await fetchWithAuth('/appointments');
    const data = await res.json();

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
      // 1. Resolve Patient Name
      const patientName = apt.patientName || apt.patient_name || (apt.patient ? (apt.patient.name || `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim()) : null) || 'Anonymous Patient';

      // 2. Resolve Doctor Name (Avoid "Dr. Dr." prefixing)
      let rawDoctor = apt.doctor ? (apt.doctor.name || apt.doctor.fullName || '') : (apt.doctorName || 'Unassigned');
      const doctorName = rawDoctor.startsWith('Dr.') ? rawDoctor : `Dr. ${rawDoctor}`;

      // 3. Resolve Department
      const deptName = apt.department ? apt.department.name : (apt.departmentName || 'General Practice');
      
      const rawDate = apt.date || apt.appointmentDate || '';
      const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';
      const timeSlot = apt.time || apt.timeSlot || 'N/A';
      const status = (apt.status || 'PENDING').toUpperCase();

      // Badge Style
      let badgeClass = 'badge-pending';
      if (status === 'CONFIRMED') badgeClass = 'badge-confirmed';
      if (status === 'COMPLETED') badgeClass = 'badge-completed';
      if (status === 'CANCELLED') badgeClass = 'badge-cancelled';

      const statusBadge = `<span class="badge ${badgeClass}">${status}</span>`;

      const safePatient = escapeHtml(patientName);
      const safeDoctor = escapeHtml(doctorName);

      // Render Table Row
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

      // Render Today's Schedule Panel
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
    tbody.innerHTML = '<tr><td colspan="7" class="table-loader" style="color:#DC2626;">Error retrieving appointment telemetry.</td></tr>';
  }
}

// Modal Handlers
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

// Submit Status Update via REST PATCH/PUT
window.submitStatusUpdate = async function() {
  const id = document.getElementById('modalAppointmentId').value;
  const newStatus = document.getElementById('modalStatusSelect').value;
  const errorEl = document.getElementById('modalError');
  const saveBtn = document.getElementById('saveStatusBtn');

  errorEl.style.display = 'none';
  saveBtn.disabled = true;
  saveBtn.innerText = 'Updating Record...';

  try {
    let res = await fetchWithAuth(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    if (res.status === 404) {
      res = await fetchWithAuth(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
    }

    const data = await res.json();

    if (res.ok && (data.success || data.id)) {
      closeManageModal();
      await fetchRecentAppointments();
      await fetchDashboardMetrics();
    } else {
      errorEl.innerText = data.message || `Error (${res.status}): Unable to modify status.`;
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Update Request Error:', err);
    errorEl.innerText = 'Network error communicating with live backend.';
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
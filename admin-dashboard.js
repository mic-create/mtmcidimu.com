// Production Render API Base URL
const API_BASE = 'https://mtmc-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('mtmc_jwt_token');
  const user = JSON.parse(localStorage.getItem('mtmc_user_info') || '{}');

  // 1. Enforce Authentication Guard (Redirect to root admin-login.html if missing)
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // 2. Populate Header Details
  if (user.email) {
    const emailDisplay = document.getElementById('adminEmailDisplay');
    const avatarBadge = document.getElementById('avatarBadge');
    if (emailDisplay) emailDisplay.innerText = user.email;
    if (avatarBadge) avatarBadge.innerText = user.email.charAt(0).toUpperCase();
  }

  // 3. Attach Logout Event
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // 4. Fetch Live Data
  fetchDashboardMetrics(token);
  fetchRecentAppointments(token);
});

// Logout Handler
function handleLogout() {
  localStorage.removeItem('mtmc_jwt_token');
  localStorage.removeItem('mtmc_user_info');
  window.location.href = 'admin-login.html';
}

// Authenticated API Wrapper
async function fetchWithAuth(endpoint, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401 || response.status === 403) {
    handleLogout();
    throw new Error('Unauthorized or expired session.');
  }

  return response.json();
}

// Fetch Metrics & Stats
async function fetchDashboardMetrics(token) {
  try {
    const data = await fetchWithAuth('/admin/stats', token);
    
    // Safely extract stats regardless of object wrapping structure
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
    console.error('Failed to load operational statistics:', error);
  }
}

// Fetch Recent Appointments
async function fetchRecentAppointments(token) {
  try {
    const data = await fetchWithAuth('/appointments', token);
    const tbody = document.getElementById('recentAppointmentsBody');
    const todayContainer = document.getElementById('todayScheduleContainer');

    const appointments = data.appointments || data.data || (Array.isArray(data) ? data : []);

    if (!tbody) return;

    if (!appointments || appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-loader">No appointment records found in database.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    if (todayContainer) todayContainer.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];
    let hasTodaySchedule = false;

    appointments.forEach((apt) => {
      // Safe property extraction matching Prisma Schema variations
      const patientName = apt.patientName || apt.patient_name || (apt.patient ? apt.patient.name : 'N/A');
      const doctorName = apt.doctor ? (apt.doctor.name || apt.doctor.fullName) : (apt.doctorName || 'Unassigned');
      const deptName = apt.department ? apt.department.name : (apt.departmentName || 'General');
      
      const rawDate = apt.date || apt.appointmentDate || '';
      const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';
      const timeSlot = apt.time || apt.timeSlot || 'N/A';
      const status = (apt.status || 'PENDING').toUpperCase();

      const statusBadge = status === 'CONFIRMED' 
        ? `<span class="badge badge-confirmed">Confirmed</span>`
        : `<span class="badge badge-pending">${status}</span>`;

      // Render Table Row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${patientName}</strong></td>
        <td>Dr. ${doctorName}</td>
        <td>${deptName}</td>
        <td>${formattedDate}</td>
        <td>${timeSlot}</td>
        <td>${statusBadge}</td>
        <td><button style="border:none; background:none; cursor:pointer; font-weight:600; color:#0B192C;">Manage</button></td>
      `;
      tbody.appendChild(row);

      // Render Today's Schedule Panel
      if (todayContainer && rawDate.startsWith(todayStr)) {
        hasTodaySchedule = true;
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.innerHTML = `
          <div class="schedule-time">${timeSlot}</div>
          <div class="schedule-patient">${patientName}</div>
          <div class="schedule-doctor">Dr. ${doctorName} (${deptName})</div>
        `;
        todayContainer.appendChild(item);
      }
    });

    if (todayContainer && !hasTodaySchedule) {
      todayContainer.innerHTML = '<p class="empty-state" style="font-size:0.8rem; color:#6B7280; padding:12px 0;">No appointments scheduled for today.</p>';
    }

  } catch (error) {
    console.error('Failed to load recent appointments:', error);
  }
}

// Helper safely updates text DOM nodes
function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}
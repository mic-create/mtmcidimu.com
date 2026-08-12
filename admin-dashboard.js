// Dynamic API Base URL Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://mtmc-backend.onrender.com/api';

// Relative path to the admin login page
const ADMIN_LOGIN_PATH = './login.html'; 

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('mtmc_jwt_token');
  const user = JSON.parse(localStorage.getItem('mtmc_user_info') || '{}');

  // 1. Enforce Authentication & Redirect if missing
  if (!token) {
    redirectToLogin();
    return;
  }

  // 2. Populate Header Information
  if (user.email) {
    const emailElem = document.getElementById('adminEmailDisplay');
    const avatarElem = document.getElementById('avatarBadge');
    if (emailElem) emailElem.innerText = user.email;
    if (avatarElem) avatarElem.innerText = user.email.charAt(0).toUpperCase();
  }

  // 3. Attach Event Listeners
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // 4. Fetch Operational Telemetry Data
  fetchDashboardMetrics(token);
  fetchRecentAppointments(token);
});

// Redirect Helper
function redirectToLogin() {
  window.location.href = ADMIN_LOGIN_PATH;
}

// Logout Handler
function handleLogout() {
  localStorage.removeItem('mtmc_jwt_token');
  localStorage.removeItem('mtmc_user_info');
  redirectToLogin();
}

// Authenticated Fetch Helper
async function fetchWithAuth(endpoint, token) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      handleLogout();
      throw new Error('Session expired or unauthorized.');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error);
    throw error;
  }
}

// Fetch Metrics for Cards
async function fetchDashboardMetrics(token) {
  try {
    const data = await fetchWithAuth('/admin/stats', token);
    
    if (data.success && data.stats) {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val ?? 0;
      };

      setVal('statTotalAppointments', data.stats.totalAppointments);
      setVal('statPendingAppointments', data.stats.pendingAppointments);
      setVal('statTodayAppointments', data.stats.todayAppointments);
      setVal('statTotalPatients', data.stats.totalPatients);
      setVal('statTotalDoctors', data.stats.totalDoctors);
      setVal('statTotalDepartments', data.stats.totalDepartments);
    }
  } catch (error) {
    console.error('Failed to load operational stats:', error);
  }
}

// Fetch Recent Appointments Table & Today's Schedule
async function fetchRecentAppointments(token) {
  try {
    const data = await fetchWithAuth('/appointments', token);
    const tbody = document.getElementById('recentAppointmentsBody');
    const todayContainer = document.getElementById('todayScheduleContainer');

    if (!tbody) return;

    if (!data.success || !data.appointments || data.appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-loader">No record found.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    if (todayContainer) todayContainer.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];
    let hasTodaySchedule = false;

    data.appointments.forEach((apt) => {
      // Format Date
      const aptDate = apt.date ? new Date(apt.date).toLocaleDateString() : 'N/A';
      const statusBadge = apt.status === 'CONFIRMED' 
        ? `<span class="badge badge-confirmed">Confirmed</span>`
        : `<span class="badge badge-pending">Pending</span>`;

      // Render Table Row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${apt.patientName || 'N/A'}</strong></td>
        <td>Dr. ${apt.doctor ? apt.doctor.name : 'Unassigned'}</td>
        <td>${apt.department ? apt.department.name : 'General'}</td>
        <td>${aptDate} ${apt.time ? 'at ' + apt.time : ''}</td>
        <td>${statusBadge}</td>
        <td><button style="border:none; background:none; cursor:pointer; font-weight:600; color:#0B192C;">Manage</button></td>
      `;
      tbody.appendChild(row);

      // Populate Today's Schedule Panel
      if (apt.date && apt.date.startsWith(todayStr) && todayContainer) {
        hasTodaySchedule = true;
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.innerHTML = `
          <div class="schedule-time">${apt.time || 'Scheduled'}</div>
          <div class="schedule-patient">${apt.patientName}</div>
          <div class="schedule-doctor">Dr. ${apt.doctor ? apt.doctor.name : 'General'}</div>
        `;
        todayContainer.appendChild(item);
      }
    });

    if (!hasTodaySchedule && todayContainer) {
      todayContainer.innerHTML = '<p class="empty-state" style="font-size:0.8rem; color:#6B7280;">No appointments scheduled for today.</p>';
    }

  } catch (error) {
    console.error('Failed to load recent appointments:', error);
  }
}
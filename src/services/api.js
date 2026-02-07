const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Get stored token
const getToken = () => localStorage.getItem('token');

// API request helper
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// Auth API
export const authAPI = {
  register: (email, password, name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  changeEmail: (newEmail, password) =>
    request('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password }),
    }),
};

/**
 * Convert a local time (HH:MM) + date (YYYY-MM-DD) to UTC ISO string.
 * This ensures times entered by the user are stored correctly regardless of server timezone.
 */
export const localTimeToUTC = (time, date) => {
  if (!time || !date) return null;
  // Create a Date object in the user's local timezone
  const localDateTime = new Date(`${date}T${time}:00`);
  // Convert to ISO string (UTC)
  return localDateTime.toISOString();
};

/**
 * Normalize a time value to HH:MM format for display.
 * Handles: ISO timestamps, "HH:MM:SS", "HH:MM", or null
 */
const normalizeTime = (value) => {
  if (!value) return null;

  // If it's an ISO timestamp (contains T or has date part)
  if (typeof value === 'string' && (value.includes('T') || (value.includes(' ') && value.includes('-')))) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }

  // If it's already a time string (HH:MM or HH:MM:SS)
  if (typeof value === 'string') {
    const parts = value.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }

  return value;
};

// Transform snake_case DB fields to camelCase for frontend
const transformShift = (shift) => {
  if (!shift) return shift;

  // Transform time blocks if they exist
  let timeBlocks = shift.timeBlocks || shift.time_blocks;
  if (typeof timeBlocks === 'string') {
    try {
      timeBlocks = JSON.parse(timeBlocks);
    } catch (e) {
      timeBlocks = [];
    }
  }

  // Transform each time block from snake_case if needed
  if (Array.isArray(timeBlocks)) {
    timeBlocks = timeBlocks.map(block => {
      return {
        id: block.id,
        startTime: normalizeTime(block.startTime || block.start_time),
        endTime: normalizeTime(block.endTime || block.end_time),
        tasks: block.tasks || '',
        isBreak: block.isBreak ?? block.is_break ?? false,
        isUnpaid: block.isUnpaid ?? block.is_unpaid ?? false
      };
    });
  }

  const transformed = {
    id: shift.id || shift._id,
    date: shift.date,
    clockInTime: normalizeTime(shift.clockInTime || shift.clock_in_time),
    clockOutTime: normalizeTime(shift.clockOutTime || shift.clock_out_time),
    totalHours: shift.totalHours || shift.total_hours || '0',
    status: shift.status || 'completed',
    timeBlocks: timeBlocks || [],
    createdAt: shift.createdAt || shift.created_at
  };

  return transformed;
};

// Shifts API
export const shiftsAPI = {
  getAll: async () => {
    const shifts = await request('/shifts');
    return Array.isArray(shifts) ? shifts.map(transformShift) : [];
  },

  // Get shifts grouped by pay week (uses Arizona time for week categorization)
  getByWeek: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/shifts/by-week${queryString ? `?${queryString}` : ''}`);
    return {
      payWeeks: (data.payWeeks || []).map(week => ({
        ...week,
        shifts: week.shifts.map(transformShift)
      }))
    };
  },

  getOne: async (id) => {
    const shift = await request(`/shifts/${id}`);
    return transformShift(shift);
  },

  create: async (shiftData) => {
    const shift = await request('/shifts', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    });
    return transformShift(shift);
  },

  update: (id, shiftData) =>
    request(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shiftData),
    }),

  delete: (id) =>
    request(`/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Admin: get all shifts from all users
  getAllAdmin: async () => {
    const shifts = await request('/shifts/admin/all');
    return Array.isArray(shifts) ? shifts.map(shift => ({
      ...transformShift(shift),
      userName: shift.user_name,
      userEmail: shift.user_email
    })) : [];
  },

  // Get pending shift for recovery
  getPending: async () => {
    const shift = await request('/shifts/pending');
    return shift ? transformShift(shift) : null;
  },

  // Clock in - create or get pending shift
  clockIn: async (date, clockInTime) => {
    const shift = await request('/shifts/clock-in', {
      method: 'POST',
      body: JSON.stringify({ date, clockInTime }),
    });
    return transformShift(shift);
  },

  // Add block to shift
  addBlock: async (shiftId, blockData) => {
    const block = await request(`/shifts/${shiftId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(blockData),
    });
    return {
      id: block.id,
      startTime: block.start_time,
      endTime: block.end_time,
      tasks: block.tasks,
      isBreak: block.is_break,
      isUnpaid: block.is_unpaid
    };
  },

  // Update block
  updateBlock: async (shiftId, blockId, blockData) => {
    const block = await request(`/shifts/${shiftId}/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(blockData),
    });
    return {
      id: block.id,
      startTime: block.start_time,
      endTime: block.end_time,
      tasks: block.tasks,
      isBreak: block.is_break,
      isUnpaid: block.is_unpaid
    };
  },

  // Delete block
  deleteBlock: async (shiftId, blockId) => {
    return request(`/shifts/${shiftId}/blocks/${blockId}`, {
      method: 'DELETE',
    });
  },

  // Clock out - complete shift
  clockOut: async (shiftId, clockInTime, clockOutTime, totalHours) => {
    const shift = await request(`/shifts/${shiftId}/clock-out`, {
      method: 'POST',
      body: JSON.stringify({ clockInTime, clockOutTime, totalHours }),
    });
    return transformShift(shift);
  },

  // Discard pending shift
  discard: async (shiftId) => {
    return request(`/shifts/${shiftId}/discard`, {
      method: 'DELETE',
    });
  },
};

// Helper to get local date as YYYY-MM-DD
function getLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => request(`/admin/dashboard?localDate=${getLocalDateString()}`),

  // Users
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  createUser: (data) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUser: (id) => request(`/admin/users/${id}`),

  updateUser: (id, data) =>
    request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateUser: (id) =>
    request(`/admin/users/${id}`, {
      method: 'DELETE',
    }),

  activateUser: (id) =>
    request(`/admin/users/${id}/activate`, {
      method: 'POST',
    }),

  resetUserPassword: (id, newPassword) =>
    request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  getUserShifts: async (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/users/${id}/shifts${queryString ? `?${queryString}` : ''}`);
  },

  // Shifts
  getShifts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/shifts${queryString ? `?${queryString}` : ''}`);
  },

  getShift: (id) => request(`/admin/shifts/${id}`),

  createShift: (data) =>
    request('/admin/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateShift: (id, data) =>
    request(`/admin/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteShift: (id) =>
    request(`/admin/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Database Browser
  getTables: () => request('/admin/database/tables'),

  getTableData: (tableName, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/database/table/${tableName}${queryString ? `?${queryString}` : ''}`);
  },

  getTableRow: (tableName, id) => request(`/admin/database/table/${tableName}/${id}`),

  updateTableRow: (tableName, id, data) =>
    request(`/admin/database/table/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTableRow: (tableName, id) =>
    request(`/admin/database/table/${tableName}/${id}`, {
      method: 'DELETE',
    }),

  insertTableRow: (tableName, data) =>
    request(`/admin/database/table/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  exportData: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/reports/export${queryString ? `?${queryString}` : ''}`);
  },

  getReportSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/reports/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Download CSV export
  downloadExport: async (params = {}) => {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const response = await fetch(
      `${API_URL}/admin/reports/export?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${params.type || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Pending Approval
  getPendingShifts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/shifts/pending${queryString ? `?${queryString}` : ''}`);
  },

  approveShift: (id) =>
    request(`/admin/shifts/${id}/approve`, {
      method: 'POST',
    }),

  revertToPending: (id) =>
    request(`/admin/shifts/${id}/revert-to-pending`, {
      method: 'POST',
    }),

  rejectShift: (id, reason) =>
    request(`/admin/shifts/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  markShiftPaid: (id) =>
    request(`/admin/shifts/${id}/mark-paid`, {
      method: 'POST',
    }),

  batchApproveShifts: (shiftIds) =>
    request('/admin/shifts/batch-approve', {
      method: 'POST',
      body: JSON.stringify({ shiftIds }),
    }),

  batchMarkPaid: (shiftIds) =>
    request('/admin/shifts/batch-paid', {
      method: 'POST',
      body: JSON.stringify({ shiftIds }),
    }),

  // Weekly View
  getWeeklyView: (weekStart) => {
    const params = weekStart ? `?weekStart=${weekStart}` : '';
    return request(`/admin/weekly-view${params}`);
  },

  getUserPayWeeks: (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/users/${userId}/pay-weeks${queryString ? `?${queryString}` : ''}`);
  },

  // Get available weeks with shifts
  getAvailableWeeks: () => request('/admin/available-weeks'),

  // Get shifts grouped by week for infinite scroll
  getShiftsByWeek: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/shifts/by-week${queryString ? `?${queryString}` : ''}`);
  },

  // Paginated Activity
  getActivity: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/dashboard/activity${queryString ? `?${queryString}` : ''}`);
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  getUnreadCount: () => request('/notifications/count'),

  markRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllRead: () =>
    request('/notifications/read-all', {
      method: 'POST',
    }),

  deleteNotification: (id) =>
    request(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

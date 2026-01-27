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
};

// Transform snake_case DB fields to camelCase for frontend
const transformShift = (shift) => {
  if (!shift) return shift;

  console.log('Raw shift from API:', shift);

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
      console.log('Raw block:', block);
      return {
        id: block.id,
        startTime: block.startTime || block.start_time || null,
        endTime: block.endTime || block.end_time || null,
        tasks: block.tasks || '',
        isBreak: block.isBreak ?? block.is_break ?? false
      };
    });
  }

  const transformed = {
    id: shift.id || shift._id,
    date: shift.date,
    clockInTime: shift.clockInTime || shift.clock_in_time || null,
    clockOutTime: shift.clockOutTime || shift.clock_out_time || null,
    totalHours: shift.totalHours || shift.total_hours || '0',
    timeBlocks: timeBlocks || [],
    createdAt: shift.createdAt || shift.created_at
  };

  console.log('Transformed shift:', transformed);
  return transformed;
};

// Shifts API
export const shiftsAPI = {
  getAll: async () => {
    const shifts = await request('/shifts');
    return Array.isArray(shifts) ? shifts.map(transformShift) : [];
  },

  getOne: async (id) => {
    const shift = await request(`/shifts/${id}`);
    return transformShift(shift);
  },

  create: (shiftData) =>
    request('/shifts', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    }),

  update: (id, shiftData) =>
    request(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shiftData),
    }),

  delete: (id) =>
    request(`/shifts/${id}`, {
      method: 'DELETE',
    }),
};

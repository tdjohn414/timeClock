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

// Shifts API
export const shiftsAPI = {
  getAll: () => request('/shifts'),

  getOne: (id) => request(`/shifts/${id}`),

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

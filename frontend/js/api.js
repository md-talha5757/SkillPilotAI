// Base URL of your backend. Change this if you deploy the backend somewhere
// (e.g. Render/Railway) — for local development, keep it as localhost.
const API_BASE = 'http://localhost:5001/api';

// Generic helper for POST requests (register, login, etc.)
async function apiPost(path, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Something went wrong');
  }
  return result;
}

// Generic helper for GET requests (fetching logged-in user, courses, jobs, etc.)
async function apiGet(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: 'GET', headers });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Something went wrong');
  }
  return result;
}

// Generic helper for PATCH requests (updating profile/goal, etc.)
async function apiPatch(path, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || 'Something went wrong');
  }
  return result;
}

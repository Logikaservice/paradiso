// In sviluppo Vite fa proxy su /api; in produzione usa VITE_API_URL (es. http://IP:3001)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('paradiso_token');
}

function getAuthHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login fallito');
  return data;
}

export async function refreshToken(refreshToken) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Refresh fallito');
  return data;
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`, { headers: getAuthHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore caricamento progetti');
  return data;
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore caricamento utenti');
  return data;
}

export async function fetchUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, { headers: getAuthHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore caricamento utente');
  return data;
}

export async function createUser(body) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore creazione utente');
  return data;
}

export async function updateUser(id, body) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore aggiornamento utente');
  return data;
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore eliminazione utente');
  return data;
}

export async function fetchAvailableProjects() {
  const res = await fetch(`${API_BASE}/projects/available`, { headers: getAuthHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Errore progetti');
  return data;
}

export { getToken, getAuthHeader };

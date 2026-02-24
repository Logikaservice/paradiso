// Base API: in sviluppo/produzione usa stesso host (VITE_API_URL opzionale)
const getApiUrl = () => import.meta.env.VITE_API_URL || '';

export function buildApiUrl(endpoint) {
  const base = getApiUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

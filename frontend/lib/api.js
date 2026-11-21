export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// credentials: 'include' so the admin cookie is sent across domains
export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

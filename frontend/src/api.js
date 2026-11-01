// Small API client for the Food2Go Express backend (replaces Amplify / API Gateway URLs)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "food2go_token";
const USER_KEY = "food2go_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const photoSrc = (photoUrl) => (photoUrl ? `${API_ORIGIN}${photoUrl}` : null);

// apiFetch("/donations", { method: "POST", body: {...} | FormData })
export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) clearSession(); // token expired
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

const TOKEN_KEY = "feedback_hub_api_token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function joinUrl(path) {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(joinUrl(path), {
    ...options,
    headers: buildHeaders(options.headers || {}),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function get(path, params = {}) {
  return apiRequest(`${path}${toQueryString(params)}`, {
    method: "GET",
  });
}

export function post(path, body = {}) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patch(path, body = {}) {
  return apiRequest(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function put(path, body = {}) {
  return apiRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function del(path) {
  return apiRequest(path, { method: "DELETE" });
}


import { clearAuthToken, get, patch, post, setAuthToken } from "@/api/httpClient";

function normalizeUser(user = {}) {
  return {
    ...user,
    gestores_responsaveis: Array.isArray(user.gestores_responsaveis)
      ? user.gestores_responsaveis
      : [],
  };
}

export const User = {
  async login(email = "") {
    const payload = email ? { email } : {};
    const data = await post("/auth/login", payload);
    if (data?.token) setAuthToken(data.token);
    return normalizeUser(data?.user || {});
  },

  async logout() {
    try {
      await post("/auth/logout", {});
    } catch {
      // Ignore logout failures and clear local token anyway.
    }
    clearAuthToken();
    return { ok: true };
  },

  async me() {
    const data = await get("/auth/me");
    return normalizeUser(data || {});
  },

  async list() {
    const rows = await get("/users");
    return Array.isArray(rows) ? rows.map(normalizeUser) : [];
  },

  async filter(criteria = {}) {
    const rows = await get("/users", criteria);
    return Array.isArray(rows) ? rows.map(normalizeUser) : [];
  },

  async create(data) {
    const created = await post("/users", data);
    return normalizeUser(created || {});
  },

  async update(id, patchData) {
    const updated = await patch(`/users/${id}`, patchData);
    return normalizeUser(updated || {});
  },

  async updateMyUserData(patchData) {
    const updated = await patch("/users/me", patchData);
    return normalizeUser(updated || {});
  },
};


import { del, get, patch, post } from "@/api/httpClient";

function normalizeFeedback(item = {}) {
  return {
    ...item,
    titulo: Array.isArray(item.titulo)
      ? item.titulo
      : item.titulo
      ? [String(item.titulo)]
      : [],
    nota: Number(item.nota || 0),
  };
}

export const Feedback = {
  async list(order = "-created_date", limit = 1000) {
    const rows = await get("/feedbacks", { order, limit });
    return Array.isArray(rows) ? rows.map(normalizeFeedback) : [];
  },

  async filter(criteria = {}, order = "-created_date", limit = 1000) {
    const rows = await get("/feedbacks", { ...criteria, order, limit });
    return Array.isArray(rows) ? rows.map(normalizeFeedback) : [];
  },

  async create(data) {
    const created = await post("/feedbacks", data);
    return normalizeFeedback(created || {});
  },

  async update(id, patchData) {
    const updated = await patch(`/feedbacks/${id}`, patchData);
    return normalizeFeedback(updated || {});
  },

  async delete(id) {
    return del(`/feedbacks/${id}`);
  },
};


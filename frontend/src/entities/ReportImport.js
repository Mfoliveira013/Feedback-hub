import { get, post } from "@/api/httpClient";

export const ReportImport = {
  async list(limit = 50) {
    const rows = await get("/report-imports", { limit });
    return Array.isArray(rows) ? rows : [];
  },

  async create(data) {
    return post("/report-imports", {
      imported_at: data.imported_at,
      file_name: data.file_name,
      imported_by_user_id: data.imported_by_user_id || null,
      imported_by_email: data.imported_by || data.imported_by_email,
      rows: Number(data.rows || 0),
      columns: data.columns || [],
      type_distribution: data.type_distribution || {},
      forced_type: data.forced_type || "",
    });
  },
};

import { pool } from "../db/pool.js";
import { toJsonString } from "../utils/json.js";
import { mapReportImportRow } from "../utils/mappers.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueEmails(values = []) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((item) => normalizeEmail(item)).filter(Boolean))
  );
}

export async function listReportImports(filters = {}) {
  const options =
    typeof filters === "object" && filters !== null ? filters : { limit: filters };
  const safeLimit = Math.max(1, Math.min(Number(options.limit || 50), 500));
  const clauses = [];
  const params = [];

  if (options.scopeEmails !== undefined) {
    const scopeEmails = uniqueEmails(options.scopeEmails);
    if (!scopeEmails.length) return [];
    const placeholders = scopeEmails.map(() => "?").join(", ");
    clauses.push(`imported_by_email IN (${placeholders})`);
    params.push(...scopeEmails);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM report_imports
     ${whereSql}
     ORDER BY imported_at DESC
     LIMIT ?`,
    [...params, safeLimit]
  );
  return rows.map(mapReportImportRow);
}

export async function createReportImport(payload) {
  const [result] = await pool.query(
    `INSERT INTO report_imports (
      imported_at, file_name, imported_by_user_id, imported_by_email,
      rows_count, columns_json, type_distribution_json, forced_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.imported_at ? new Date(payload.imported_at) : new Date(),
      payload.file_name,
      payload.imported_by_user_id || null,
      payload.imported_by_email || "",
      Number(payload.rows || payload.rows_count || 0),
      toJsonString(payload.columns || [], "[]"),
      toJsonString(payload.type_distribution || {}, "{}"),
      payload.forced_type || null,
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM report_imports WHERE id = ?",
    [result.insertId]
  );
  return rows[0] ? mapReportImportRow(rows[0]) : null;
}


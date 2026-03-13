import { pool } from "../db/pool.js";

function normalizeSetor(value = "") {
  return String(value || "").trim();
}

export async function listAllowedSetoresByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT setor
     FROM user_setores
     WHERE user_id = ?
     ORDER BY setor ASC`,
    [userId]
  );

  return rows
    .map((row) => normalizeSetor(row.setor))
    .filter(Boolean);
}

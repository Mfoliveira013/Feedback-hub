import { pool } from "../db/pool.js";
import { mapUserRow } from "../utils/mappers.js";

const TEAM_SELECT = `
  SELECT
    u.*,
    GROUP_CONCAT(DISTINCT g.email ORDER BY g.email SEPARATOR ',') AS gestores_responsaveis_csv
  FROM users u
  LEFT JOIN user_gestores ug ON ug.user_id = u.id
  LEFT JOIN users g ON g.id = ug.gestor_user_id
`;

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export async function listTeamUsersByManagerEmail(managerEmail) {
  const normalizedEmail = normalizeEmail(managerEmail);
  if (!normalizedEmail) {
    return [];
  }

  const [rows] = await pool.query(
    `${TEAM_SELECT}
     WHERE u.gerente_responsavel_email = ?
     GROUP BY u.id
     ORDER BY u.full_name ASC, u.email ASC`,
    [normalizedEmail]
  );

  return rows.map(mapUserRow);
}

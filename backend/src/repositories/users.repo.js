import { pool } from "../db/pool.js";
import { toLegacyCargo } from "../utils/cargo.js";
import { mapUserRow } from "../utils/mappers.js";

const USER_SELECT = `
  SELECT
    u.*,
    GROUP_CONCAT(DISTINCT g.email ORDER BY g.email SEPARATOR ',') AS gestores_responsaveis_csv
  FROM users u
  LEFT JOIN user_gestores ug ON ug.user_id = u.id
  LEFT JOIN users g ON g.id = ug.gestor_user_id
`;

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeSetor(value = "") {
  return String(value).trim();
}

function uniqueEmails(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((item) => normalizeEmail(item))
        .filter(Boolean)
    )
  );
}

function uniqueSetores(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((item) => normalizeSetor(item))
        .filter(Boolean)
    )
  );
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `${USER_SELECT}
     WHERE u.id = ?
     GROUP BY u.id`,
    [id]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `${USER_SELECT}
     WHERE u.email = ?
     GROUP BY u.id`,
    [normalizeEmail(email)]
  );
  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function listUsers(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.cargo) {
    clauses.push("u.cargo = ?");
    params.push(toLegacyCargo(filters.cargo));
  }
  if (filters.setor) {
    clauses.push("u.setor = ?");
    params.push(filters.setor);
  }
  if (filters.email) {
    clauses.push("u.email = ?");
    params.push(normalizeEmail(filters.email));
  }
  if (filters.search) {
    clauses.push("(u.full_name LIKE ? OR u.email LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.scopeUserId !== undefined && filters.scopeUserId !== null) {
    clauses.push("u.id = ?");
    params.push(Number(filters.scopeUserId));
  }

  if (filters.scopeSetores !== undefined) {
    const setores = uniqueSetores(filters.scopeSetores);
    if (!setores.length) return [];
    const placeholders = setores.map(() => "?").join(", ");
    clauses.push(`u.setor IN (${placeholders})`);
    params.push(...setores);
  }

  if (filters.scopeEmails !== undefined) {
    const emails = uniqueEmails(filters.scopeEmails);
    if (!emails.length) return [];
    const placeholders = emails.map(() => "?").join(", ");
    clauses.push(`u.email IN (${placeholders})`);
    params.push(...emails);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `${USER_SELECT}
     ${whereSql}
     GROUP BY u.id
     ORDER BY u.full_name ASC, u.email ASC`,
    params
  );

  return rows.map(mapUserRow);
}

async function findUsersByEmails(connection, emails = []) {
  const normalized = uniqueEmails(emails);
  if (!normalized.length) return [];
  const placeholders = normalized.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT id, email FROM users WHERE email IN (${placeholders})`,
    normalized
  );
  return rows;
}

async function replaceManagers(connection, userId, managerEmails = []) {
  await connection.query("DELETE FROM user_gestores WHERE user_id = ?", [userId]);
  const managerRows = await findUsersByEmails(connection, managerEmails);
  for (let index = 0; index < managerRows.length; index += 1) {
    const manager = managerRows[index];
    if (manager.id === userId) continue;
    await connection.query(
      "INSERT INTO user_gestores (user_id, gestor_user_id) VALUES (?, ?)",
      [userId, manager.id]
    );
  }
}

export async function createUser(data) {
  const email = normalizeEmail(data.email);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO users
        (email, full_name, cargo, setor, funcao, filial, tema, foto_perfil, gerente_responsavel_email, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        data.full_name || "",
        toLegacyCargo(data.cargo),
        data.setor || null,
        data.funcao || null,
        data.filial || null,
        data.tema || "claro",
        data.foto_perfil || null,
        normalizeEmail(data.gerente_responsavel || data.gerente_responsavel_email || "") || null,
        data.is_active === false ? 0 : 1,
      ]
    );
    await replaceManagers(connection, result.insertId, data.gestores_responsaveis || []);
    await connection.commit();
    return findUserById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUser(userId, patch) {
  const fields = [];
  const params = [];

  const plainFields = [
    ["full_name", patch.full_name],
    ["cargo", patch.cargo === undefined ? undefined : toLegacyCargo(patch.cargo)],
    ["setor", patch.setor],
    ["funcao", patch.funcao],
    ["filial", patch.filial],
    ["tema", patch.tema],
    ["foto_perfil", patch.foto_perfil],
    ["is_active", patch.is_active === undefined ? undefined : patch.is_active ? 1 : 0],
  ];

  for (let index = 0; index < plainFields.length; index += 1) {
    const [column, value] = plainFields[index];
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      params.push(value === "" ? null : value);
    }
  }

  if (patch.gerente_responsavel !== undefined || patch.gerente_responsavel_email !== undefined) {
    const manager = normalizeEmail(
      patch.gerente_responsavel ?? patch.gerente_responsavel_email ?? ""
    );
    fields.push("gerente_responsavel_email = ?");
    params.push(manager || null);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (fields.length > 0) {
      await connection.query(
        `UPDATE users
         SET ${fields.join(", ")}
         WHERE id = ?`,
        [...params, userId]
      );
    }

    if (patch.gestores_responsaveis !== undefined) {
      await replaceManagers(connection, userId, patch.gestores_responsaveis);
    }

    await connection.commit();
    return findUserById(userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


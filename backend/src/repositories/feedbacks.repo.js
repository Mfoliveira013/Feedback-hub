import { pool } from "../db/pool.js";
import { toJsonString } from "../utils/json.js";
import { mapFeedbackRow } from "../utils/mappers.js";

function buildOrderBy(order = "-created_date") {
  const value = String(order || "-created_date");
  const desc = value.startsWith("-");
  const field = desc ? value.slice(1) : value;
  const allowed = new Set(["created_date", "data_ocorrido", "nota", "updated_date"]);
  const safeField = allowed.has(field) ? field : "created_date";
  return `${safeField} ${desc ? "DESC" : "ASC"}`;
}

function toBool(value) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  const text = String(value).trim().toLowerCase();
  return ["1", "true", "sim", "yes", "y"].includes(text);
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeSetor(value = "") {
  return String(value || "").trim();
}

function uniqueValues(values = [], normalizer = (value) => value) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((value) => normalizer(value)).filter(Boolean))
  );
}

function addFilter(clauses, params, condition, value) {
  if (value === undefined || value === null || value === "") return;
  clauses.push(condition);
  params.push(value);
}

function normalizePatchValue(column, value) {
  if (column === "titulo_json") return toJsonString(value, "[]");
  if (column === "arquivos_anexados_json") return value ? toJsonString(value, "[]") : null;
  if (["anonimo", "retroativo", "notificacao_manual_necessaria"].includes(column)) {
    if (value === undefined) return undefined;
    return value ? 1 : 0;
  }
  if (column === "nota") return Number(value ?? 0);
  if (["nota_produtividade", "nota_conduta", "nota_engajamento"].includes(column)) {
    return value === null || value === "" || value === undefined ? null : Number(value);
  }
  return value;
}

export async function listFeedbacks(filters = {}) {
  const clauses = [];
  const params = [];

  addFilter(clauses, params, "tipo_avaliacao = ?", filters.tipo_avaliacao);
  addFilter(clauses, params, "destinatario_email = ?", filters.destinatario_email);
  addFilter(clauses, params, "remetente_email = ?", filters.remetente_email);
  addFilter(clauses, params, "classificacao = ?", filters.classificacao);
  addFilter(clauses, params, "status_email = ?", filters.status_email);
  addFilter(clauses, params, "status_avaliacao = ?", filters.status_avaliacao);

  const retroativo = toBool(filters.retroativo);
  if (retroativo !== undefined) {
    clauses.push("retroativo = ?");
    params.push(retroativo ? 1 : 0);
  }

  if (filters.from_date) {
    clauses.push("COALESCE(data_ocorrido, created_date) >= ?");
    params.push(`${filters.from_date} 00:00:00`);
  }
  if (filters.to_date) {
    clauses.push("COALESCE(data_ocorrido, created_date) <= ?");
    params.push(`${filters.to_date} 23:59:59`);
  }
  if (filters.search) {
    clauses.push(
      "(remetente_nome LIKE ? OR destinatario_nome LIKE ? OR descricao LIKE ? OR remetente_email LIKE ? OR destinatario_email LIKE ?)"
    );
    const search = `%${filters.search}%`;
    params.push(search, search, search, search, search);
  }

  if (filters.scopeSetores !== undefined) {
    const scopeSetores = uniqueValues(filters.scopeSetores, normalizeSetor);
    if (!scopeSetores.length) return [];
    const placeholders = scopeSetores.map(() => "?").join(", ");
    clauses.push(`destinatario_setor IN (${placeholders})`);
    params.push(...scopeSetores);
  }

  if (filters.scopeEmails !== undefined) {
    const scopeEmails = uniqueValues(filters.scopeEmails, normalizeEmail);
    if (!scopeEmails.length) return [];
    const placeholders = scopeEmails.map(() => "?").join(", ");
    clauses.push(
      `(destinatario_email IN (${placeholders}) OR remetente_email IN (${placeholders}))`
    );
    params.push(...scopeEmails, ...scopeEmails);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.max(1, Math.min(Number(filters.limit || 1000), 10000));
  const orderBy = buildOrderBy(filters.order);

  const [rows] = await pool.query(
    `SELECT * FROM feedbacks
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ?`,
    [...params, limit]
  );
  return rows.map(mapFeedbackRow);
}

export async function findFeedbackById(id) {
  const [rows] = await pool.query("SELECT * FROM feedbacks WHERE id = ?", [id]);
  return rows[0] ? mapFeedbackRow(rows[0]) : null;
}

export async function createFeedback(payload) {
  const [result] = await pool.query(
    `INSERT INTO feedbacks (
      data_ocorrido,
      remetente_user_id, remetente_email, remetente_nome,
      destinatario_user_id, destinatario_email, destinatario_nome, destinatario_setor,
      tipo_avaliacao, titulo_json, descricao, nota, classificacao, anonimo, retroativo,
      registrado_por_cargo, status_email, motivo_falha_email, notificacao_manual_necessaria,
      status_avaliacao, enviado_por_admin_email,
      cargo_colaborador, funcao, nota_produtividade, nota_conduta, nota_engajamento,
      observacoes, arquivos_anexados_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`,
    [
      payload.data_ocorrido ? new Date(payload.data_ocorrido) : new Date(),
      payload.remetente_user_id || null,
      payload.remetente_email || "",
      payload.remetente_nome || "",
      payload.destinatario_user_id || null,
      payload.destinatario_email || "",
      payload.destinatario_nome || "",
      payload.destinatario_setor || null,
      payload.tipo_avaliacao || "feedback",
      toJsonString(payload.titulo || [], "[]"),
      payload.descricao || "",
      Number(payload.nota ?? 0),
      payload.classificacao || null,
      payload.anonimo ? 1 : 0,
      payload.retroativo ? 1 : 0,
      payload.registrado_por_cargo || null,
      payload.status_email || "pendente",
      payload.motivo_falha_email || null,
      payload.notificacao_manual_necessaria ? 1 : 0,
      payload.status_avaliacao || "Rascunho",
      payload.enviado_por_admin_email || null,
      payload.cargo_colaborador || null,
      payload.funcao || null,
      payload.nota_produtividade === undefined ? null : Number(payload.nota_produtividade),
      payload.nota_conduta === undefined ? null : Number(payload.nota_conduta),
      payload.nota_engajamento === undefined ? null : Number(payload.nota_engajamento),
      payload.observacoes || null,
      payload.arquivos_anexados ? toJsonString(payload.arquivos_anexados, "[]") : null,
    ]
  );

  return findFeedbackById(result.insertId);
}

export async function updateFeedback(id, patch) {
  const allowed = {
    data_ocorrido: "data_ocorrido",
    remetente_user_id: "remetente_user_id",
    remetente_email: "remetente_email",
    remetente_nome: "remetente_nome",
    destinatario_user_id: "destinatario_user_id",
    destinatario_email: "destinatario_email",
    destinatario_nome: "destinatario_nome",
    destinatario_setor: "destinatario_setor",
    tipo_avaliacao: "tipo_avaliacao",
    titulo: "titulo_json",
    descricao: "descricao",
    nota: "nota",
    classificacao: "classificacao",
    anonimo: "anonimo",
    retroativo: "retroativo",
    registrado_por_cargo: "registrado_por_cargo",
    status_email: "status_email",
    motivo_falha_email: "motivo_falha_email",
    notificacao_manual_necessaria: "notificacao_manual_necessaria",
    status_avaliacao: "status_avaliacao",
    enviado_por_admin_email: "enviado_por_admin_email",
    cargo_colaborador: "cargo_colaborador",
    funcao: "funcao",
    nota_produtividade: "nota_produtividade",
    nota_conduta: "nota_conduta",
    nota_engajamento: "nota_engajamento",
    observacoes: "observacoes",
    arquivos_anexados: "arquivos_anexados_json",
  };

  const fields = [];
  const params = [];

  Object.entries(allowed).forEach(([payloadKey, column]) => {
    if (patch[payloadKey] === undefined) return;
    fields.push(`${column} = ?`);
    params.push(normalizePatchValue(column, patch[payloadKey]));
  });

  if (!fields.length) {
    return findFeedbackById(id);
  }

  await pool.query(
    `UPDATE feedbacks
     SET ${fields.join(", ")}
     WHERE id = ?`,
    [...params, id]
  );

  return findFeedbackById(id);
}

export async function deleteFeedback(id) {
  const [result] = await pool.query("DELETE FROM feedbacks WHERE id = ?", [id]);
  return result.affectedRows > 0;
}


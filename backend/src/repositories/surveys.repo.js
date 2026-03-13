import { pool } from "../db/pool.js";
import { toJsonString } from "../utils/json.js";
import { mapPeriodicSurveyRow, mapSurveyResponseRow } from "../utils/mappers.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueEmails(values = []) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((item) => normalizeEmail(item)).filter(Boolean))
  );
}

export async function listPeriodicSurveys(filters = {}) {
  const options =
    typeof filters === "object" && filters !== null ? filters : { limit: filters };
  const safeLimit = Math.max(1, Math.min(Number(options.limit || 5000), 10000));
  const clauses = [];
  const params = [];

  if (options.scopeEmails !== undefined) {
    const scopeEmails = uniqueEmails(options.scopeEmails);
    if (!scopeEmails.length) return [];
    const placeholders = scopeEmails.map(() => "?").join(", ");
    clauses.push(
      `(destinatario_email IN (${placeholders}) OR remetente_email IN (${placeholders}))`
    );
    params.push(...scopeEmails, ...scopeEmails);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM periodic_surveys
     ${whereSql}
     ORDER BY created_date DESC
     LIMIT ?`,
    [...params, safeLimit]
  );
  return rows.map(mapPeriodicSurveyRow);
}

export async function createPeriodicSurvey(payload) {
  const [result] = await pool.query(
    `INSERT INTO periodic_surveys (
      tipo_pesquisa, data_envio,
      destinatario_user_id, destinatario_email, destinatario_nome, destinatario_cargo, destinatario_setor,
      remetente_user_id, remetente_email, remetente_nome,
      status_email, motivo_falha_email, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.tipo_pesquisa,
      payload.data_envio ? new Date(payload.data_envio) : new Date(),
      payload.destinatario_user_id || null,
      payload.destinatario_email,
      payload.destinatario_nome || null,
      payload.destinatario_cargo || null,
      payload.destinatario_setor || null,
      payload.remetente_user_id || null,
      payload.remetente_email,
      payload.remetente_nome || null,
      payload.status_email || "pendente",
      payload.motivo_falha_email || null,
      payload.status || "Enviado",
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM periodic_surveys WHERE id = ?",
    [result.insertId]
  );
  return rows[0] ? mapPeriodicSurveyRow(rows[0]) : null;
}

export async function listPeriodicSurveyResponses(filters = {}) {
  const options =
    typeof filters === "object" && filters !== null ? filters : { limit: filters };
  const safeLimit = Math.max(1, Math.min(Number(options.limit || 5000), 10000));
  const clauses = [];
  const params = [];

  if (options.scopeEmails !== undefined) {
    const scopeEmails = uniqueEmails(options.scopeEmails);
    if (!scopeEmails.length) return [];
    const placeholders = scopeEmails.map(() => "?").join(", ");
    clauses.push(
      `(colaborador_email IN (${placeholders}) OR remetente_email IN (${placeholders}))`
    );
    params.push(...scopeEmails, ...scopeEmails);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM periodic_survey_responses
     ${whereSql}
     ORDER BY data_resposta DESC
     LIMIT ?`,
    [...params, safeLimit]
  );
  return rows.map(mapSurveyResponseRow);
}

export async function createPeriodicSurveyResponse(payload) {
  const [result] = await pool.query(
    `INSERT INTO periodic_survey_responses (
      pesquisa_id, tipo_pesquisa, data_resposta,
      colaborador_user_id, colaborador_email, colaborador_nome, colaborador_cargo, colaborador_setor,
      remetente_user_id, remetente_email, remetente_nome,
      respostas_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.pesquisa_id,
      payload.tipo_pesquisa,
      payload.data_resposta ? new Date(payload.data_resposta) : new Date(),
      payload.colaborador_user_id || null,
      payload.colaborador_email,
      payload.colaborador_nome || null,
      payload.colaborador_cargo || null,
      payload.colaborador_setor || null,
      payload.remetente_user_id || null,
      payload.remetente_email,
      payload.remetente_nome || null,
      toJsonString(payload.respostas || [], "[]"),
      payload.status || "Concluida",
    ]
  );

  const [rows] = await pool.query(
    "SELECT * FROM periodic_survey_responses WHERE id = ?",
    [result.insertId]
  );
  return rows[0] ? mapSurveyResponseRow(rows[0]) : null;
}


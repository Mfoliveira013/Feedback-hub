import { parseJson } from "./json.js";
import { getCargoScope, toLegacyCargo } from "./cargo.js";

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapUserRow(row) {
  const gestores = String(row.gestores_responsaveis_csv || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name || "",
    cargo: toLegacyCargo(row.cargo),
    cargo_scope: getCargoScope(row),
    setor: row.setor || "",
    funcao: row.funcao || "",
    filial: row.filial || "",
    tema: row.tema || "claro",
    foto_perfil: row.foto_perfil || "",
    gerente_responsavel: row.gerente_responsavel_email || "",
    gestores_responsaveis: gestores,
    is_active: Boolean(row.is_active),
    created_date: toIso(row.created_date),
    updated_date: toIso(row.updated_date),
  };
}

export function mapFeedbackRow(row) {
  return {
    id: row.id,
    created_date: toIso(row.created_date),
    updated_date: toIso(row.updated_date),
    data_ocorrido: toIso(row.data_ocorrido),
    remetente_user_id: row.remetente_user_id,
    remetente_email: row.remetente_email || "",
    remetente_nome: row.remetente_nome || "",
    destinatario_user_id: row.destinatario_user_id,
    destinatario_email: row.destinatario_email || "",
    destinatario_nome: row.destinatario_nome || "",
    destinatario_setor: row.destinatario_setor || "",
    tipo_avaliacao: row.tipo_avaliacao || "feedback",
    titulo: parseJson(row.titulo_json, []),
    descricao: row.descricao || "",
    nota: Number(row.nota || 0),
    classificacao: row.classificacao || "",
    anonimo: Boolean(row.anonimo),
    retroativo: Boolean(row.retroativo),
    registrado_por_cargo: row.registrado_por_cargo || "",
    status_email: row.status_email || "pendente",
    motivo_falha_email: row.motivo_falha_email || "",
    notificacao_manual_necessaria: Boolean(row.notificacao_manual_necessaria),
    status_avaliacao: row.status_avaliacao || "Rascunho",
    enviado_por_admin_email: row.enviado_por_admin_email || "",
    cargo_colaborador: row.cargo_colaborador || "",
    funcao: row.funcao || "",
    nota_produtividade: row.nota_produtividade === null ? null : Number(row.nota_produtividade),
    nota_conduta: row.nota_conduta === null ? null : Number(row.nota_conduta),
    nota_engajamento: row.nota_engajamento === null ? null : Number(row.nota_engajamento),
    observacoes: row.observacoes || "",
    arquivos_anexados: parseJson(row.arquivos_anexados_json, []),
  };
}

export function mapPeriodicSurveyRow(row) {
  const periodo = String(row.tipo_pesquisa || "").replace(/\s*dias?$/i, "");
  return {
    id: row.id,
    created_date: toIso(row.created_date),
    data_envio: toIso(row.data_envio),
    colaborador_email: row.destinatario_email,
    colaborador_nome: row.destinatario_nome || row.destinatario_email,
    remetente_email: row.remetente_email,
    remetente_nome: row.remetente_nome || row.remetente_email,
    periodo,
    periodo_label: row.tipo_pesquisa || "",
    tipo_pesquisa: row.tipo_pesquisa || "",
    status_email: row.status_email || "pendente",
    status: row.status || "Enviado",
  };
}

export function mapSurveyResponseRow(row) {
  return {
    id: row.id,
    pesquisa_id: row.pesquisa_id,
    colaborador_email: row.colaborador_email,
    colaborador_nome: row.colaborador_nome || row.colaborador_email,
    colaborador_cargo: row.colaborador_cargo || "",
    colaborador_setor: row.colaborador_setor || "",
    tipo_pesquisa: row.tipo_pesquisa,
    remetente_email: row.remetente_email,
    remetente_nome: row.remetente_nome || row.remetente_email,
    respostas: parseJson(row.respostas_json, []),
    data_resposta: toIso(row.data_resposta),
    status: row.status || "Concluida",
  };
}

export function mapReportImportRow(row) {
  return {
    id: row.id,
    imported_at: toIso(row.imported_at),
    file_name: row.file_name,
    imported_by: row.imported_by_email,
    rows: Number(row.rows_count || 0),
    columns: parseJson(row.columns_json, []),
    type_distribution: parseJson(row.type_distribution_json, {}),
    forced_type: row.forced_type || "",
  };
}


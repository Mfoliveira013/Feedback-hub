import React, { useEffect, useMemo, useState } from "react";
import { Download, FileJson2, FileSpreadsheet, FileUp, UploadCloud } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { ReportImport } from "@/entities/ReportImport";
import { canExecuteAction, getFriendlyDeniedMessage } from "@/components/utils/ui-permissions";

const TYPE_LABELS = {
  feedback: "Feedback",
  avaliacao_pontual: "Avaliacao Pontual",
  avaliacao_periodica: "Avaliacao Periodica",
  avaliacao_aic: "Avaliacao A.I.C",
};

function classificationFromScore(score) {
  if (score < 2) return "Nao atende";
  if (score < 3) return "Atende abaixo";
  if (score < 4) return "Atende";
  if (score < 5) return "Supera parcialmente";
  return "Supera";
}

function parseBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "1", "sim", "yes", "y"].includes(normalized);
}

function parseDateToIso(value) {
  const raw = String(value || "").trim();
  if (!raw) return new Date().toISOString();

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (br) {
    const [, day, month, year, hour = "12", minute = "00"] = br;
    const iso = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
  }

  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createRowAccessor(row) {
  const normalizedMap = new Map();
  Object.entries(row || {}).forEach(([key, value]) => {
    normalizedMap.set(normalizeKey(key), value);
  });

  return (...aliases) => {
    for (let index = 0; index < aliases.length; index += 1) {
      const alias = aliases[index];
      const direct = row?.[alias];
      if (direct !== undefined && String(direct).trim() !== "") return direct;

      const normalized = normalizedMap.get(normalizeKey(alias));
      if (normalized !== undefined && String(normalized).trim() !== "") return normalized;
    }
    return "";
  };
}

function extractEmailFromText(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : "";
}

function resolveUserEmail(rawValue, users = []) {
  const text = String(rawValue || "").trim();
  if (!text) return "";

  const extractedEmail = extractEmailFromText(text);
  if (extractedEmail) return extractedEmail;

  const normalizedText = normalizeText(text);
  const byName = users.find((user) => normalizeText(user.full_name) === normalizedText);
  if (byName?.email) return byName.email.toLowerCase();

  const byPartialName = users.find((user) => normalizeText(user.full_name).includes(normalizedText));
  if (byPartialName?.email) return byPartialName.email.toLowerCase();

  return "";
}

function mapTypeValue(value) {
  const text = normalizeText(value);
  if (!text) return "";

  if (
    [
      "feedback",
      "feed back",
      "fb",
    ].includes(text)
  ) {
    return "feedback";
  }

  if (
    [
      "avaliacao_pontual",
      "avaliacao pontual",
      "pontual",
      "retroativa",
      "avaliacao retroativa",
    ].includes(text)
  ) {
    return "avaliacao_pontual";
  }

  if (
    [
      "avaliacao_periodica",
      "avaliacao periodica",
      "periodica",
      "periodico",
      "pesquisa periodica",
      "pesquisa_periodica",
      "formulario 7 dias",
      "formulario 45 dias",
      "formulario 90 dias",
      "7 dias",
      "45 dias",
      "90 dias",
    ].includes(text)
  ) {
    return "avaliacao_periodica";
  }

  if (
    [
      "avaliacao_aic",
      "avaliacao aic",
      "aic",
      "a.i.c",
      "avaliacao individual do colaborador",
      "avaliacao individual colaborador",
    ].includes(text)
  ) {
    return "avaliacao_aic";
  }

  return "";
}

function inferEvaluationType(row, getField = null) {
  const get = getField || ((...keys) => {
    for (let i = 0; i < keys.length; i += 1) {
      const value = row?.[keys[i]];
      if (value !== undefined && String(value).trim() !== "") return value;
    }
    return "";
  });

  const directCandidates = [
    get("tipo_avaliacao", "tipo", "avaliacao_tipo", "tipo_da_avaliacao", "tipo da avaliacao", "tipo de avaliacao"),
    get("categoria", "modelo", "formulario_tipo", "report_type", "relatorio_tipo"),
  ];

  for (let index = 0; index < directCandidates.length; index += 1) {
    const mapped = mapTypeValue(directCandidates[index]);
    if (mapped) {
      return { tipo: mapped, source: "campo" };
    }
  }

  const keywordBlob = normalizeText(
    [
      get("titulo", "title", "assunto", "tipo_titulo"),
      get("descricao", "description", "observacoes"),
      get("formulario", "periodo", "periodo_label", "relatorio"),
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (
    keywordBlob.includes("aic") ||
    keywordBlob.includes("a.i.c") ||
    keywordBlob.includes("avaliacao individual")
  ) {
    return { tipo: "avaliacao_aic", source: "conteudo" };
  }

  if (
    keywordBlob.includes("periodic") ||
    keywordBlob.includes("pesquisa periodica") ||
    keywordBlob.includes("7 dias") ||
    keywordBlob.includes("45 dias") ||
    keywordBlob.includes("90 dias")
  ) {
    return { tipo: "avaliacao_periodica", source: "conteudo" };
  }

  if (
    keywordBlob.includes("pontual") ||
    keywordBlob.includes("retroativ")
  ) {
    return { tipo: "avaliacao_pontual", source: "conteudo" };
  }

  if (keywordBlob.includes("feedback")) {
    return { tipo: "feedback", source: "conteudo" };
  }

  return { tipo: "feedback", source: "padrao" };
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolons >= commas ? ";" : ",";

  const headers = parseCsvLine(headerLine, delimiter).map((header) =>
    header.replace(/^"|"$/g, "").trim()
  );

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = String(values[index] ?? "").replace(/^"|"$/g, "");
    });
    return row;
  });
}

function normalizeEvaluationRow(row, currentUser, forcedType = "", users = []) {
  const getField = createRowAccessor(row);
  const notaRaw = Number(
    getField("nota", "score", "nota_media", "media", "media_nota", "media_geral") || 0
  );
  const nota = Number.isFinite(notaRaw) ? notaRaw : 0;

  const remetenteEmailRaw = getField(
    "remetente_email",
    "de_email",
    "avaliador_email",
    "email_avaliador",
    "remetente",
    "de",
    "from",
    "autor_email"
  );
  const remetenteEmail =
    resolveUserEmail(remetenteEmailRaw, users) || currentUser?.email || "";

  const remetenteNome =
    getField("remetente_nome", "de_nome", "avaliador_nome", "nome_avaliador", "autor_nome") ||
    currentUser?.full_name ||
    remetenteEmail;

  const destinatarioRaw = getField(
    "destinatario_email",
    "para_email",
    "colaborador_email",
    "email_colaborador",
    "funcionario_email",
    "usuario_email",
    "email_destinatario",
    "destinatario",
    "para",
    "colaborador",
    "funcionario",
    "usuario",
    "to",
    "email"
  );
  const destinatarioEmail = resolveUserEmail(destinatarioRaw, users);

  const destinatarioNome =
    getField(
      "destinatario_nome",
      "para_nome",
      "colaborador_nome",
      "funcionario_nome",
      "nome_destinatario",
      "nome_colaborador",
      "nome_funcionario",
      "nome",
      "colaborador",
      "destinatario",
      "para"
    ) ||
    users.find((user) => normalizeText(user.email) === normalizeText(destinatarioEmail))
      ?.full_name ||
    destinatarioEmail;

  const tituloBase =
    getField("titulo", "title", "assunto", "tipo_titulo", "tema", "competencia") ||
    "Avaliacao Importada";

  const inferredType = inferEvaluationType(row, getField);
  const explicitType = mapTypeValue(
    getField("tipo_avaliacao", "tipo", "avaliacao_tipo", "tipo_da_avaliacao", "tipo da avaliacao")
  );
  const forcedMapped = mapTypeValue(forcedType);
  const tipoAvaliacao = forcedMapped || explicitType || inferredType.tipo;
  const retroativoFromText = normalizeText(
    `${getField("tipo", "tipo_avaliacao")} ${getField("titulo", "assunto")} ${getField("descricao", "observacoes")}`
  ).includes("retroativ");

  if (!destinatarioEmail) {
    return {
      error: "Linha ignorada: destinatario/email/colaborador ausente ou nao reconhecido.",
      inferred: {
        tipo: tipoAvaliacao,
        source: forcedMapped
          ? "override"
          : explicitType
          ? "campo"
          : inferredType.source,
      },
    };
  }

  return {
    inferred: {
      tipo: tipoAvaliacao,
      source: forcedMapped
        ? "override"
        : explicitType
        ? "campo"
        : inferredType.source,
    },
    payload: {
      remetente_email: remetenteEmail,
      remetente_nome: remetenteNome,
      destinatario_email: destinatarioEmail,
      destinatario_nome: destinatarioNome,
      titulo: [tituloBase],
      descricao:
        getField("descricao", "description", "observacoes", "comentario", "texto") ||
        "Avaliacao importada",
      nota,
      classificacao: getField("classificacao", "rating_classification") || classificationFromScore(nota),
      tipo_avaliacao: tipoAvaliacao,
      registrado_por_cargo: getField("registrado_por_cargo", "cargo_registro") || currentUser?.cargo || "",
      status_email: getField("status_email", "email_status") || "pendente",
      status_avaliacao: getField("status_avaliacao", "avaliacao_status") || "Enviada",
      retroativo: parseBoolean(getField("retroativo")) || retroativoFromText,
      data_ocorrido: parseDateToIso(
        getField("data_ocorrido", "data", "ocorrido_em", "data_evento", "data_avaliacao")
      ),
    },
  };
}

export default function ImportacaoRelatorios() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [rowsPreview, setRowsPreview] = useState([]);
  const [columnsPreview, setColumnsPreview] = useState([]);
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [reportImports, setReportImports] = useState([]);
  const [forcedType, setForcedType] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");

  const inferredTypeSummary = useMemo(() => {
    const summary = {
      feedback: 0,
      avaliacao_pontual: 0,
      avaliacao_periodica: 0,
      avaliacao_aic: 0,
    };

    rawRows.forEach((row) => {
      const normalized = normalizeEvaluationRow(row, currentUser, forcedType, allUsers);
      const key =
        normalized.payload?.tipo_avaliacao ||
        normalized.inferred?.tipo;
      if (key) {
        summary[key] = (summary[key] || 0) + 1;
      }
    });

    return summary;
  }, [rawRows, currentUser, forcedType, allUsers]);

  const previewWithInference = useMemo(() => {
    return rowsPreview.map((row) => {
      const normalized = normalizeEvaluationRow(row, currentUser, forcedType, allUsers);
      return {
        row,
        inferredType:
          normalized.payload?.tipo_avaliacao ||
          normalized.inferred?.tipo ||
          "feedback",
        source: normalized.inferred?.source || "padrao",
      };
    });
  }, [rowsPreview, currentUser, forcedType, allUsers]);

  useEffect(() => {
    async function load() {
      const [me, users, reports] = await Promise.all([
        User.me(),
        User.list(),
        ReportImport.list(50),
      ]);
      setCurrentUser(me);
      setAllUsers(users);
      setReportImports(reports);
    }
    load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar dados iniciais");
    });
  }, []);

  const sampleColumns = useMemo(() => {
    return [
      "destinatario_email",
      "destinatario_nome",
      "remetente_email",
      "remetente_nome",
      "titulo",
      "descricao",
      "nota",
      "tipo_avaliacao",
      "data_ocorrido",
      "classificacao",
      "status_email",
      "status_avaliacao",
      "retroativo",
    ];
  }, []);

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setMessage("");
      setErrors([]);

      const text = await file.text();
      const extension = file.name.split(".").pop()?.toLowerCase();

      let parsed = [];
      if (extension === "json") {
        const jsonData = JSON.parse(text);
        if (Array.isArray(jsonData)) {
          parsed = jsonData;
        } else if (Array.isArray(jsonData?.data)) {
          parsed = jsonData.data;
        } else {
          throw new Error("JSON invalido: esperado array de objetos ou objeto com campo data[].");
        }
      } else {
        parsed = parseCsv(text);
      }

      setFileName(file.name);
      setRawRows(parsed);
      setColumnsPreview(Object.keys(parsed[0] || {}));
      setRowsPreview(parsed.slice(0, 5));
      setMessage(parsed.length ? "" : "Arquivo carregado, mas sem linhas validas.");
    } catch (error) {
      setFileName(file.name);
      setRawRows([]);
      setColumnsPreview([]);
      setRowsPreview([]);
      setMessage(error instanceof Error ? error.message : "Falha ao ler arquivo.");
    }
  }

  async function importEvaluations() {
    if (!canExecuteAction(currentUser, "report_import")) {
      setPermissionMessage(getFriendlyDeniedMessage("acao"));
      return;
    }
    if (!rawRows.length) {
      setMessage("Selecione um arquivo antes de importar.");
      return;
    }

    setImporting(true);
    setErrors([]);
    setMessage("");

    const importErrors = [];
    let importedCount = 0;
    const importedByType = {
      feedback: 0,
      avaliacao_pontual: 0,
      avaliacao_periodica: 0,
      avaliacao_aic: 0,
    };

    try {
      for (let index = 0; index < rawRows.length; index += 1) {
        const row = rawRows[index];
        const normalized = normalizeEvaluationRow(row, currentUser, forcedType, allUsers);

        if (normalized.error) {
          importErrors.push(`Linha ${index + 1}: ${normalized.error}`);
          continue;
        }

        await Feedback.create(normalized.payload);
        importedCount += 1;
        importedByType[normalized.payload.tipo_avaliacao] =
          (importedByType[normalized.payload.tipo_avaliacao] || 0) + 1;
      }

      setErrors(importErrors.slice(0, 10));
      const byTypeText = Object.entries(importedByType)
        .filter(([, total]) => total > 0)
        .map(([type, total]) => `${TYPE_LABELS[type] || type}: ${total}`)
        .join(" | ");
      setMessage(
        `Importacao concluida: ${importedCount} avaliacao(oes) importada(s). ${byTypeText ? `(${byTypeText})` : ""}${forcedType ? ` | modo forcado: ${TYPE_LABELS[forcedType] || forcedType}` : ""}`
      );
      setPermissionMessage("");
    } catch (error) {
      if (error?.status === 403) {
        setPermissionMessage(getFriendlyDeniedMessage("acao"));
        return;
      }
      setMessage(error instanceof Error ? error.message : "Erro ao importar avaliacoes.");
    } finally {
      setImporting(false);
    }
  }

  async function importReportMetadata() {
    if (!canExecuteAction(currentUser, "report_import")) {
      setPermissionMessage(getFriendlyDeniedMessage("acao"));
      return;
    }
    if (!rawRows.length) {
      setMessage("Selecione um arquivo antes de importar relatorio.");
      return;
    }

    const metadata = {
      id: `report-${Date.now()}`,
      file_name: fileName || "arquivo-sem-nome",
      imported_at: new Date().toISOString(),
      imported_by_user_id: currentUser?.id || null,
      imported_by: currentUser?.email || "-",
      rows: rawRows.length,
      columns: columnsPreview,
      type_distribution: inferredTypeSummary,
      forced_type: forcedType || "",
    };

    try {
      const created = await ReportImport.create(metadata);
      setReportImports((prev) => [created, ...prev].slice(0, 50));
      setMessage(`Relatorio registrado: ${metadata.file_name} (${metadata.rows} linhas).`);
      setPermissionMessage("");
    } catch (error) {
      if (error?.status === 403) {
        setPermissionMessage(getFriendlyDeniedMessage("acao"));
        return;
      }
      setMessage(error instanceof Error ? error.message : "Falha ao registrar metadados de importacao.");
    }
  }

  function downloadTemplate() {
    const header = sampleColumns.join(";");
    const example = [
      "ana@empresa.com",
      "Ana Souza",
      "gestor@empresa.com",
      "Gestor Exemplo",
      "Produtividade",
      "Descricao do feedback",
      "4.3",
      "feedback",
      "10/03/2026",
      "Supera parcialmente",
      "enviado",
      "Enviada",
      "false",
    ].join(";");

    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-importacao-avaliacoes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={FileUp}
        title="Importacao de Relatorios"
        subtitle="Importe arquivos CSV/JSON para registrar relatorios e criar avaliacoes em lote."
        actions={
          <button type="button" onClick={downloadTemplate} className="fh-button-secondary">
            <Download className="h-4 w-4" />
            Baixar Template
          </button>
        }
      />
      {permissionMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {permissionMessage}
        </div>
      ) : null}

      <section className="fh-card">
        <div className="fh-card-header">Upload de Arquivo</div>
        <div className="fh-card-body space-y-4">
          <label className="block">
            <span className="fh-field-label">Arquivo (CSV ou JSON)</span>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-800/70">
              <UploadCloud className="mx-auto h-8 w-8 text-slate-500 dark:text-slate-300" />
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Selecione um arquivo com dados de avaliacao ou relatorio.
              </p>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-slate-300"
              />
            </div>
          </label>

          {fileName ? (
            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Arquivo carregado: <strong>{fileName}</strong> ({rawRows.length} linha(s)).
            </div>
          ) : null}

          <label className="block max-w-sm">
            <span className="fh-field-label">Modo de Classificacao de Tipo</span>
            <select
              value={forcedType}
              onChange={(event) => setForcedType(event.target.value)}
              className="fh-select"
            >
              <option value="">Automatico (detectar por linha)</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  Forcar tudo como: {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Se voce escolher um tipo fixo, todas as linhas serao importadas com esse tipo.
            </p>
          </label>

          {rawRows.length > 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Tipos identificados automaticamente:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(inferredTypeSummary)
                  .filter(([, total]) => total > 0)
                  .map(([type, total]) => (
                    <span key={type} className="fh-chip">
                      {TYPE_LABELS[type] || type}: {total}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={importReportMetadata}
              disabled={importing || !rawRows.length || !canExecuteAction(currentUser, "report_import")}
              className="fh-button-secondary"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Importar Relatorio
            </button>
            <button
              type="button"
              onClick={importEvaluations}
              disabled={importing || !rawRows.length || !canExecuteAction(currentUser, "report_import")}
              className="fh-button-primary"
            >
              <FileJson2 className="h-4 w-4" />
              {importing ? "Importando..." : "Importar Avaliacoes"}
            </button>
          </div>

          {message ? (
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>
          ) : null}

          {errors.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-semibold">Linhas com erro (mostrando ate 10):</p>
              <ul className="mt-1 list-disc pl-4">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Campos Esperados</div>
        <div className="fh-card-body flex flex-wrap gap-2">
          {sampleColumns.map((column) => (
            <span key={column} className="fh-chip">
              {column}
            </span>
          ))}
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Preview do Arquivo</div>
        <div className="fh-card-body space-y-3">
          {columnsPreview.length > 0 ? (
            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    {columnsPreview.map((column) => (
                      <th key={column} className="px-2 py-2">
                        {column}
                      </th>
                    ))}
                    <th className="px-2 py-2">tipo_inferido</th>
                    <th className="px-2 py-2">fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {previewWithInference.map(({ row, inferredType, source }, index) => (
                    <tr key={`${fileName}-${index}`} className="border-t border-slate-100 dark:border-slate-700">
                      {columnsPreview.map((column) => (
                        <td key={`${column}-${index}`} className="px-2 py-2 text-slate-700 dark:text-slate-200">
                          {String(row[column] ?? "-")}
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <span className="fh-chip">{TYPE_LABELS[inferredType] || inferredType}</span>
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
                        {source === "override"
                          ? "override"
                          : source === "campo"
                          ? "campo"
                          : source === "conteudo"
                          ? "conteudo"
                          : "padrao"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum arquivo carregado.</p>
          )}
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Historico de Relatorios Importados</div>
        <div className="fh-card-body overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2">Arquivo</th>
                <th className="px-2 py-2">Linhas</th>
                <th className="px-2 py-2">Colunas</th>
                <th className="px-2 py-2">Tipos detectados</th>
                <th className="px-2 py-2">Modo</th>
                <th className="px-2 py-2">Importado por</th>
              </tr>
            </thead>
            <tbody>
              {reportImports.map((report) => (
                <tr key={report.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                    {new Date(report.imported_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">{report.file_name}</td>
                  <td className="px-2 py-2">{report.rows}</td>
                  <td className="px-2 py-2">{Array.isArray(report.columns) ? report.columns.length : 0}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(report.type_distribution || {})
                        .filter(([, total]) => total > 0)
                        .map(([type, total]) => (
                          <span key={`${report.id}-${type}`} className="fh-chip">
                            {TYPE_LABELS[type] || type}: {total}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                    {report.forced_type ? `Forcado: ${TYPE_LABELS[report.forced_type] || report.forced_type}` : "Automatico"}
                  </td>
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{report.imported_by}</td>
                </tr>
              ))}
              {reportImports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhum relatorio importado ate o momento.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

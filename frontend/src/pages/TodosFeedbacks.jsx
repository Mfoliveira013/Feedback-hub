import React, { useEffect, useMemo, useState } from "react";
import {
  CircleX,
  Download,
  FileText,
  Mail,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { SendEmail } from "@/integrations/Core";
import {
  canDelete,
  filterFeedbacksByPermission,
} from "@/components/utils/permissoes";
import { canExecuteAction, getFriendlyDeniedMessage } from "@/components/utils/ui-permissions";
import PageHeader from "@/components/layout/PageHeader";
import ReenviarEmailModal from "@/components/Feedback/ReenviarEmailModal";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function formatTitle(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "Sem titulo";
}

function badgeForClassification(classification = "") {
  const normalized = classification.toLowerCase();
  if (normalized.includes("supera")) return "bg-blue-100 text-blue-700";
  if (normalized.includes("atende") && normalized.includes("abaixo")) return "bg-orange-100 text-orange-700";
  if (normalized.includes("nao")) return "bg-rose-100 text-rose-700";
  if (normalized.includes("atende")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function inDateRange(value, start, end) {
  if (!start && !end) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (start && date < new Date(`${start}T00:00:00`)) return false;
  if (end && date > new Date(`${end}T23:59:59`)) return false;
  return true;
}

export default function TodosFeedbacks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resendTarget, setResendTarget] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const user = await User.me();
      const [users, feedbacks] = await Promise.all([
        User.list(),
        Feedback.list("-created_date", 5000),
      ]);
      setCurrentUser(user);
      setRows(filterFeedbacksByPermission(feedbacks, user, users));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const text = search.toLowerCase().trim();

    return rows.filter((item) => {
      const matchesText =
        text.length === 0 ||
        item.remetente_nome?.toLowerCase().includes(text) ||
        item.destinatario_nome?.toLowerCase().includes(text) ||
        item.descricao?.toLowerCase().includes(text);

      const matchesType =
        !typeFilter || (item.tipo_avaliacao || "feedback") === typeFilter;

      const matchesDate = inDateRange(item.data_ocorrido || item.created_date, startDate, endDate);

      return matchesText && matchesType && matchesDate;
    });
  }, [rows, search, typeFilter, startDate, endDate]);

  async function onDelete(id) {
    if (!currentUser || !canDelete(currentUser) || !canExecuteAction(currentUser, "feedback_delete")) {
      setPermissionMessage(getFriendlyDeniedMessage("acao"));
      return;
    }
    const shouldDelete = window.confirm("Confirmar exclusao da avaliacao?");
    if (!shouldDelete) return;
    try {
      await Feedback.delete(id);
      await loadData();
      setPermissionMessage("");
    } catch (err) {
      if (err?.status === 403) {
        setPermissionMessage(getFriendlyDeniedMessage("acao"));
        return;
      }
      throw err;
    }
  }

  async function onConfirmResend() {
    if (!resendTarget) return;
    setSendingEmail(true);
    try {
      if (!canExecuteAction(currentUser, "feedback_resend_email")) {
        setPermissionMessage(getFriendlyDeniedMessage("acao"));
        return;
      }
      await SendEmail({
        to: resendTarget.destinatario_email,
        subject: `Reenvio: ${formatTitle(resendTarget.titulo)}`,
      });
      await Feedback.update(resendTarget.id, { status_email: "enviado" });
      setResendTarget(null);
      await loadData();
      setPermissionMessage("");
    } catch (err) {
      if (err?.status === 403) {
        setPermissionMessage(getFriendlyDeniedMessage("acao"));
        return;
      }
      window.alert(err instanceof Error ? err.message : "Erro no reenvio");
    } finally {
      setSendingEmail(false);
    }
  }

  function exportCsv() {
    const headers = [
      "Data",
      "Tipo",
      "Titulo",
      "Remetente",
      "Destinatario",
      "Classificacao",
      "Nota",
      "Descricao",
    ];
    const lines = filteredRows.map((item) => [
      formatDate(item.data_ocorrido || item.created_date),
      item.tipo_avaliacao || "feedback",
      formatTitle(item.titulo),
      item.remetente_nome || item.remetente_email || "-",
      item.destinatario_nome || item.destinatario_email || "-",
      item.classificacao || "-",
      Number(item.nota || 0).toFixed(1),
      String(item.descricao || "").replace(/\n/g, " "),
    ]);

    const csv = [headers, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "avaliacoes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-sm text-slate-600">Carregando avaliacoes...</p>;
  if (error) return <p className="text-sm text-rose-600">Erro: {error}</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={FileText}
        title="Todas as Avaliacoes"
        subtitle="Visualize e gerencie todos os feedbacks da empresa."
      />
      {permissionMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {permissionMessage}
        </div>
      ) : null}

      <section className="fh-card">
        <div className="fh-card-header">Filtros de Pesquisa</div>
        <div className="fh-card-body grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block xl:col-span-1">
            <span className="fh-field-label">Buscar por Nome</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="fh-input pl-9"
                placeholder="Digite o nome do remetente ou destinatario"
              />
            </div>
          </label>

          <label className="block">
            <span className="fh-field-label">Data de Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="fh-input"
            />
          </label>

          <label className="block">
            <span className="fh-field-label">Data de Fim</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="fh-input"
            />
          </label>

          <label className="block">
            <span className="fh-field-label">Tipo de Avaliacao</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="fh-select"
            >
              <option value="">Todos os tipos</option>
              <option value="feedback">Feedback</option>
              <option value="avaliacao_pontual">Avaliacao pontual</option>
              <option value="avaliacao_periodica">Avaliacao periodica</option>
              <option value="avaliacao_aic">Avaliacao A.I.C</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-4">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="fh-button-secondary"
            >
              <CircleX className="h-4 w-4" />
              Limpar Filtros
            </button>
            <button type="button" onClick={exportCsv} className="fh-button-primary">
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>

          <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-4">
            {filteredRows.length} resultados encontrados.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        {filteredRows.map((item) => (
          <article key={item.id} className="fh-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{formatTitle(item.titulo)}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  De: <strong>{item.remetente_nome || item.remetente_email || "-"}</strong>
                </p>
                <p className="text-sm text-slate-600">
                  Para: <strong>{item.destinatario_nome || item.destinatario_email || "-"}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`fh-chip ${item.status_email === "enviado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.status_email === "enviado" ? "E-mail Enviado" : "E-mail Pendente"}
                </span>
                <span className={`fh-chip ${badgeForClassification(item.classificacao)}`}>
                  {item.classificacao || "Sem classificacao"}
                </span>
                <button type="button" className="fh-button-secondary h-8 w-8 p-0" title="Editar" disabled>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="fh-button-secondary h-8 w-8 p-0"
                  title="Reenviar e-mail"
                  disabled={!canExecuteAction(currentUser, "feedback_resend_email")}
                  onClick={() => setResendTarget(item)}
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!canDelete(currentUser) || !canExecuteAction(currentUser, "feedback_delete")}
                  onClick={() => onDelete(item.id)}
                  className="h-8 w-8 rounded-md border border-rose-300 bg-rose-50 p-0 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Excluir"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-4 rounded-md bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
              {item.descricao || "Sem descricao."}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Ocorrido em: {formatDate(item.data_ocorrido || item.created_date)}</span>
              <span className="fh-chip">
                Registrado por: {item.registrado_por_cargo || "-"}
              </span>
            </div>
          </article>
        ))}

        {filteredRows.length === 0 ? (
          <div className="fh-card p-10 text-center text-sm text-slate-500">
            Nenhuma avaliacao encontrada com os filtros selecionados.
          </div>
        ) : null}
      </section>

      <ReenviarEmailModal
        isOpen={Boolean(resendTarget)}
        feedback={resendTarget}
        isLoading={sendingEmail}
        onClose={() => {
          if (!sendingEmail) setResendTarget(null);
        }}
        onConfirm={onConfirmResend}
      />
    </div>
  );
}

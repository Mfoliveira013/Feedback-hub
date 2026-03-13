import React, { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Eye, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { canDelete, filterFeedbacksByPermission } from "@/components/utils/permissoes";
import { canExecuteAction, getFriendlyDeniedMessage } from "@/components/utils/ui-permissions";

function inDateRange(value, start, end) {
  if (!start && !end) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (start && date < new Date(`${start}T00:00:00`)) return false;
  if (end && date > new Date(`${end}T23:59:59`)) return false;
  return true;
}

function extractScore(description, label) {
  const regex = new RegExp(`${label}:\\s*(\\d(?:\\.\\d+)?)\\/5`, "i");
  const match = String(description || "").match(regex);
  return match ? match[1] : "-";
}

export default function TodasAvaliacoesAIC() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const user = await User.me();
      const [users, feedbacks] = await Promise.all([User.list(), Feedback.list("-created_date", 5000)]);
      const allowed = filterFeedbacksByPermission(feedbacks, user, users).filter(
        (item) => item.tipo_avaliacao === "avaliacao_aic"
      );
      setRows(allowed);
      setCurrentUser(user);
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
        !text ||
        String(item.remetente_nome || "").toLowerCase().includes(text) ||
        String(item.destinatario_nome || "").toLowerCase().includes(text);
      const matchesDate = inDateRange(item.data_ocorrido || item.created_date, startDate, endDate);
      return matchesText && matchesDate;
    });
  }, [rows, search, startDate, endDate]);

  async function onDelete(id) {
    if (!currentUser || !canDelete(currentUser) || !canExecuteAction(currentUser, "feedback_delete")) {
      setPermissionMessage(getFriendlyDeniedMessage("acao"));
      return;
    }

    if (!window.confirm("Excluir esta avaliacao A.I.C?")) return;
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

  if (loading) return <p className="text-sm text-slate-600">Carregando avaliacoes A.I.C...</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={ClipboardCheck}
        title="Todas as Avaliacoes A.I.C"
        subtitle="Visualize e gerencie todas as avaliacoes A.I.C da empresa."
      />
      {permissionMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {permissionMessage}
        </div>
      ) : null}

      <section className="fh-card">
        <div className="fh-card-header">Filtros de Pesquisa</div>
        <div className="fh-card-body grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="fh-field-label">Buscar por Nome</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="fh-input pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o nome do remetente ou destinatario"
              />
            </div>
          </label>
          <label className="block">
            <span className="fh-field-label">Data de Inicio</span>
            <input
              type="date"
              className="fh-input"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="fh-field-label">Data de Fim</span>
            <input
              type="date"
              className="fh-input"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <p className="text-sm text-slate-500 md:col-span-3">{filteredRows.length} resultados encontrados.</p>
        </div>
      </section>

      <section className="space-y-3">
        {filteredRows.map((item) => (
          <article key={item.id} className="fh-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-900">Avaliacao A.I.C</h3>
                <p className="text-sm text-slate-600">De: {item.remetente_nome || item.remetente_email || "-"}</p>
                <p className="text-sm text-slate-600">Para: {item.destinatario_nome || item.destinatario_email || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="fh-chip bg-emerald-100 text-emerald-700">E-mail {item.status_email || "pendente"}</span>
                <span className="fh-chip bg-blue-100 text-blue-700">{item.nota || 0} - {item.classificacao || "-"}</span>
                <button type="button" className="fh-button-secondary h-8 w-8 p-0" title="Visualizar" disabled>
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={!canDelete(currentUser) || !canExecuteAction(currentUser, "feedback_delete")}
                  className="h-8 w-8 rounded-md border border-rose-300 bg-rose-50 p-0 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Excluir"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Produtividade</p>
                <p className="text-3xl font-extrabold text-blue-700">{extractScore(item.descricao, "Produtividade")}/5</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Conduta Pessoal</p>
                <p className="text-3xl font-extrabold text-blue-700">{extractScore(item.descricao, "Conduta Pessoal")}/5</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Engajamento</p>
                <p className="text-3xl font-extrabold text-blue-700">{extractScore(item.descricao, "Engajamento")}/5</p>
              </div>
            </div>

            <p className="mt-3 rounded-md bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">{item.descricao || "Sem observacoes."}</p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Avaliada em: {new Date(item.created_date).toLocaleString("pt-BR")}</span>
              <span className="fh-chip">Registrado por: {item.registrado_por_cargo || "-"}</span>
            </div>
          </article>
        ))}

        {filteredRows.length === 0 ? (
          <div className="fh-card p-8 text-center text-sm text-slate-500">
            Nenhuma avaliacao A.I.C encontrada para os filtros selecionados.
          </div>
        ) : null}
      </section>
    </div>
  );
}

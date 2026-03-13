import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { canExecuteAction } from "@/components/utils/ui-permissions";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function inDateRange(value, start, end) {
  if (!start && !end) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (start && date < new Date(`${start}T00:00:00`)) return false;
  if (end && date > new Date(`${end}T23:59:59`)) return false;
  return true;
}

function classTone(value = "") {
  const text = value.toLowerCase();
  if (text.includes("supera")) return "bg-blue-100 text-blue-700";
  if (text.includes("nao")) return "bg-rose-100 text-rose-700";
  if (text.includes("abaixo")) return "bg-orange-100 text-orange-700";
  if (text.includes("atende")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function Relatorios() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    tipo: "",
    usuario: "",
    classificacao: "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [me, feedbacks, allUsers] = await Promise.all([
          User.me(),
          Feedback.list("-created_date", 5000),
          User.list(),
        ]);
        setCurrentUser(me);
        setRows(feedbacks);
        setUsers(allUsers);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (!inDateRange(item.data_ocorrido || item.created_date, filters.startDate, filters.endDate)) {
        return false;
      }

      if (filters.tipo && (item.tipo_avaliacao || "feedback") !== filters.tipo) return false;
      if (filters.usuario && item.destinatario_email !== filters.usuario) return false;
      if (filters.classificacao && (item.classificacao || "") !== filters.classificacao) return false;
      return true;
    });
  }, [rows, filters]);

  const classificationOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((item) => item.classificacao).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  function onChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters({ startDate: "", endDate: "", tipo: "", usuario: "", classificacao: "" });
  }

  function exportCsv() {
    const headers = ["Data", "Tipo", "Titulo", "De", "Para", "Classificacao", "Descricao"];
    const lines = filteredRows.map((item) => [
      formatDate(item.data_ocorrido || item.created_date),
      item.tipo_avaliacao || "feedback",
      Array.isArray(item.titulo) ? item.titulo.join(", ") : item.titulo || "Sem titulo",
      item.remetente_nome || item.remetente_email || "-",
      item.destinatario_nome || item.destinatario_email || "-",
      item.classificacao || "-",
      String(item.descricao || "").replace(/\n/g, " "),
    ]);

    const csv = [headers, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "relatorio-avaliacoes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-sm text-slate-600">Carregando relatorios...</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={FileSpreadsheet}
        title="Relatorios de Avaliacao"
        subtitle="Visualize e exporte dados de avaliacoes com filtros personalizados."
        actions={
          canExecuteAction(currentUser, "report_import") ? (
            <Link to={createPageUrl("ImportacaoRelatorios")} className="fh-button-secondary">
              Importar Relatorios
            </Link>
          ) : null
        }
      />

      <section className="fh-card">
        <div className="fh-card-header">Filtros de Pesquisa</div>
        <div className="fh-card-body grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="fh-field-label">Data Inicio</span>
            <input
              type="date"
              className="fh-input"
              value={filters.startDate}
              onChange={(event) => onChange("startDate", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="fh-field-label">Data Fim</span>
            <input
              type="date"
              className="fh-input"
              value={filters.endDate}
              onChange={(event) => onChange("endDate", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="fh-field-label">Tipo de Avaliacao</span>
            <select
              className="fh-select"
              value={filters.tipo}
              onChange={(event) => onChange("tipo", event.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="feedback">Feedback</option>
              <option value="avaliacao_pontual">Avaliacao Pontual</option>
              <option value="avaliacao_periodica">Avaliacao Periodica</option>
              <option value="avaliacao_aic">Avaliacao A.I.C</option>
            </select>
          </label>
          <label className="block">
            <span className="fh-field-label">Usuario</span>
            <select
              className="fh-select"
              value={filters.usuario}
              onChange={(event) => onChange("usuario", event.target.value)}
            >
              <option value="">Todos os usuarios</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="fh-field-label">Classificacao</span>
            <select
              className="fh-select"
              value={filters.classificacao}
              onChange={(event) => onChange("classificacao", event.target.value)}
            >
              <option value="">Todas as classificacoes</option>
              {classificationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2 xl:col-span-5">
            <button type="button" onClick={resetFilters} className="fh-button-secondary">
              Limpar Filtros
            </button>
            <button type="button" onClick={exportCsv} className="fh-button-primary">
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>

          <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-5">
            {filteredRows.length} resultados encontrados.
          </p>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Resultados da Pesquisa</div>
        <div className="fh-card-body overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Data do Ocorrido</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Titulo</th>
                <th className="px-2 py-2">De</th>
                <th className="px-2 py-2">Para</th>
                <th className="px-2 py-2">Classificacao</th>
                <th className="px-2 py-2">Descricao</th>
                <th className="px-2 py-2">Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2 text-slate-600">{formatDate(item.data_ocorrido || item.created_date)}</td>
                  <td className="px-2 py-2">{item.tipo_avaliacao || "feedback"}</td>
                  <td className="px-2 py-2 font-semibold text-slate-800">
                    {Array.isArray(item.titulo) ? item.titulo.join(", ") : item.titulo || "Sem titulo"}
                  </td>
                  <td className="px-2 py-2">{item.remetente_nome || item.remetente_email || "-"}</td>
                  <td className="px-2 py-2">{item.destinatario_nome || item.destinatario_email || "-"}</td>
                  <td className="px-2 py-2">
                    <span className={`fh-chip ${classTone(item.classificacao || "")}`}>
                      {item.classificacao || "-"}
                    </span>
                  </td>
                  <td className="max-w-[380px] px-2 py-2 text-slate-700">{item.descricao || "-"}</td>
                  <td className="px-2 py-2">
                    <span className="fh-chip">{item.registrado_por_cargo || "-"}</span>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-center text-slate-500">
                    Nenhum resultado encontrado com os filtros selecionados.
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

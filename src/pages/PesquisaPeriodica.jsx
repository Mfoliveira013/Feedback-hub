import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, SendHorizontal } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { User } from "@/entities/User";
import { PeriodicSurvey } from "@/entities/PeriodicSurvey";

const PERIOD_OPTIONS = [
  { value: "7", label: "Formulario 7 dias" },
  { value: "45", label: "Formulario 45 dias" },
  { value: "90", label: "Formulario 90 dias" },
];

export default function PesquisaPeriodica() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ colaborador_email: "", periodo: "" });

  useEffect(() => {
    async function load() {
      const [me, allUsers, surveys] = await Promise.all([
        User.me(),
        User.list(),
        PeriodicSurvey.list(5000),
      ]);
      setCurrentUser(me);
      setUsers(allUsers.filter((user) => user.email !== me.email));
      setRows(surveys);
    }
    load().catch((error) => {
      window.alert(error instanceof Error ? error.message : "Falha ao carregar pesquisas periodicas");
    });
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [rows]);

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!currentUser || !form.colaborador_email || !form.periodo) {
      window.alert("Selecione colaborador e periodo da pesquisa.");
      return;
    }

    const collaborator = users.find((user) => user.email === form.colaborador_email);
    try {
      const created = await PeriodicSurvey.create({
        colaborador_email: form.colaborador_email,
        colaborador_nome: collaborator?.full_name || form.colaborador_email,
        periodo: form.periodo,
        remetente_email: currentUser.email,
        remetente_nome: currentUser.full_name || currentUser.email,
      });
      setRows((prev) => [created, ...prev]);
      setForm({ colaborador_email: "", periodo: "" });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Falha ao enviar formulario");
    }
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={ClipboardList}
        title="Pesquisa Periodica de Acompanhamento"
        subtitle="Envie formularios de acompanhamento pos-contratacao para colaboradores."
      />

      <section className="fh-card">
        <div className="fh-card-header">Enviar Formulario de Pesquisa</div>
        <form onSubmit={onSubmit} className="fh-card-body grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="fh-field-label">Colaborador(a) *</span>
            <select
              className="fh-select"
              value={form.colaborador_email}
              onChange={(event) => onChange("colaborador_email", event.target.value)}
            >
              <option value="">Escolha um colaborador</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="fh-field-label">Periodo da Pesquisa *</span>
            <select
              className="fh-select"
              value={form.periodo}
              onChange={(event) => onChange("periodo", event.target.value)}
            >
              <option value="">Escolha o periodo</option>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="fh-button-primary w-full">
              <SendHorizontal className="h-4 w-4" />
              Enviar Formulario
            </button>
          </div>
        </form>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Sobre os Formularios</div>
        <div className="fh-card-body space-y-3 text-sm">
          <div>
            <p className="font-semibold text-blue-700">Formulario 7 dias - Adaptacao Inicial</p>
            <p className="text-slate-600">Avalia adaptacao inicial ao ambiente, equipe e processos basicos.</p>
          </div>
          <div>
            <p className="font-semibold text-blue-700">Formulario 45 dias - Desenvolvimento Inicial</p>
            <p className="text-slate-600">Avalia desenvolvimento tecnico, autonomia e alinhamento cultural.</p>
          </div>
          <div>
            <p className="font-semibold text-blue-700">Formulario 90 dias - Fechamento de Ciclo</p>
            <p className="text-slate-600">Avalia desempenho consolidado, evolucao profissional e proximos passos.</p>
          </div>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Historico de Envios</div>
        <div className="fh-card-body overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2">Colaborador</th>
                <th className="px-2 py-2">Periodo</th>
                <th className="px-2 py-2">Enviado por</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-600">
                    {new Date(row.created_date).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-2 py-2">{row.colaborador_nome}</td>
                  <td className="px-2 py-2">{row.periodo_label}</td>
                  <td className="px-2 py-2">{row.remetente_nome}</td>
                  <td className="px-2 py-2">
                    <span className="fh-chip bg-emerald-100 text-emerald-700">{row.status}</span>
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-slate-500">
                    Nenhum formulario enviado ainda.
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

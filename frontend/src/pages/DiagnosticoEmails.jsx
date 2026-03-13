import React, { useMemo, useState } from "react";
import { Mail, Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Feedback } from "@/entities/Feedback";

export default function DiagnosticoEmails() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [rows, setRows] = useState([]);

  async function onSearch(event) {
    event.preventDefault();
    const all = await Feedback.list("-created_date", 5000);
    const target = email.toLowerCase().trim();
    const filtered = target
      ? all.filter((item) => String(item.destinatario_email || "").toLowerCase().includes(target))
      : [];
    setSearchEmail(target);
    setRows(filtered);
  }

  const summary = useMemo(() => {
    return {
      total: rows.length,
      sent: rows.filter((item) => item.status_email === "enviado").length,
      pending: rows.filter((item) => item.status_email !== "enviado").length,
    };
  }, [rows]);

  return (
    <div className="fh-page">
      <PageHeader
        icon={Mail}
        title="Diagnostico de E-mails"
        subtitle="Verifique o status de envio de e-mails de avaliacoes para colaboradores especificos."
      />

      <section className="fh-card">
        <div className="fh-card-header">Buscar Avaliacoes por E-mail</div>
        <form onSubmit={onSearch} className="fh-card-body space-y-3">
          <p className="text-sm text-slate-600">
            Digite o e-mail do colaborador para verificar todas as avaliacoes enviadas.
          </p>
          <label className="block">
            <span className="fh-field-label">E-mail do Colaborador</span>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="fh-input pl-9"
                  placeholder="exemplo@empresa.com"
                  required
                />
              </div>
              <button type="submit" className="fh-button-primary">
                Buscar
              </button>
            </div>
          </label>
        </form>
      </section>

      {searchEmail ? (
        <section className="fh-card">
          <div className="fh-card-header">Resultado do Diagnostico</div>
          <div className="fh-card-body space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="fh-chip">E-mail pesquisado: {searchEmail}</span>
              <span className="fh-chip">Total: {summary.total}</span>
              <span className="fh-chip bg-emerald-100 text-emerald-700">Enviados: {summary.sent}</span>
              <span className="fh-chip bg-amber-100 text-amber-700">Pendentes: {summary.pending}</span>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Data</th>
                    <th className="px-2 py-2">Titulo</th>
                    <th className="px-2 py-2">Remetente</th>
                    <th className="px-2 py-2">Status E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 text-slate-600">
                        {new Date(row.created_date).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-2">
                        {Array.isArray(row.titulo) ? row.titulo.join(", ") : row.titulo || "Sem titulo"}
                      </td>
                      <td className="px-2 py-2">{row.remetente_nome || row.remetente_email || "-"}</td>
                      <td className="px-2 py-2">
                        <span
                          className={`fh-chip ${
                            row.status_email === "enviado"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.status_email || "pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                        Nenhum registro encontrado para esse e-mail.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

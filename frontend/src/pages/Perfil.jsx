import React, { useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { User } from "@/entities/User";
import { Feedback } from "@/entities/Feedback";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", setor: "", funcao: "" });
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const me = await User.me();
        const allFeedbacks = await Feedback.list("-created_date", 5000);
        setUser(me);
        setForm({
          full_name: me.full_name || "",
          setor: me.setor || "",
          funcao: me.funcao || "",
        });
        setFeedbacks(allFeedbacks);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    if (!user) return { received: 0, sent: 0, average: "0.0" };

    const received = feedbacks.filter((item) => item.destinatario_email === user.email);
    const sent = feedbacks.filter((item) => item.remetente_email === user.email);
    const average = received.length
      ? (received.reduce((acc, item) => acc + Number(item.nota || 0), 0) / received.length).toFixed(1)
      : "0.0";

    return { received: received.length, sent: sent.length, average };
  }, [feedbacks, user]);

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await User.update(user.id, {
        full_name: form.full_name,
        setor: form.setor,
        funcao: form.funcao,
      });
      setUser(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Carregando perfil...</p>;
  if (!user) return <p className="text-sm text-slate-600">Usuario nao encontrado.</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={UserRound}
        title="Meu Perfil"
        subtitle="Gerencie suas informacoes pessoais e acompanhe suas estatisticas."
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
        <section className="fh-card">
          <div className="fh-card-header flex items-center justify-between">
            <span>Informacoes Pessoais</span>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="fh-button-secondary h-8 px-3 text-xs"
            >
              {editing ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className="fh-card-body space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                {getInitials(user.full_name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Foto de Perfil</p>
                <button type="button" className="fh-button-secondary mt-1 h-8 px-3 text-xs" disabled>
                  Alterar Foto
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="fh-field-label">E-mail</span>
                <input value={user.email} className="fh-input" readOnly />
              </label>
              <label className="block">
                <span className="fh-field-label">Cargo de Acesso</span>
                <input value={user.cargo || "-"} className="fh-input" readOnly />
              </label>
              <label className="block md:col-span-2">
                <span className="fh-field-label">Gestor(es) Responsavel(is)</span>
                <input
                  value={user.gestores_responsaveis?.join(", ") || "Nenhum"}
                  className="fh-input"
                  readOnly
                />
              </label>

              <label className="block">
                <span className="fh-field-label">Nome Completo</span>
                <input
                  value={editing ? form.full_name : user.full_name || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                  className="fh-input"
                  readOnly={!editing}
                />
              </label>
              <label className="block">
                <span className="fh-field-label">Filial</span>
                <input value={user.filial || "Nao definida"} className="fh-input" readOnly />
              </label>
              <label className="block">
                <span className="fh-field-label">Setor</span>
                <input
                  value={editing ? form.setor : user.setor || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, setor: event.target.value }))}
                  className="fh-input"
                  readOnly={!editing}
                />
              </label>
              <label className="block">
                <span className="fh-field-label">Funcao Funcional</span>
                <input
                  value={editing ? form.funcao : user.funcao || "Nao definida"}
                  onChange={(event) => setForm((prev) => ({ ...prev, funcao: event.target.value }))}
                  className="fh-input"
                  readOnly={!editing}
                />
              </label>
            </div>

            {editing ? (
              <div className="flex justify-end">
                <button type="button" onClick={onSave} className="fh-button-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alteracoes"}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="fh-card h-fit">
          <div className="fh-card-header">Minhas Estatisticas</div>
          <div className="fh-card-body space-y-3">
            <div className="rounded-md bg-amber-50 px-3 py-3 text-center">
              <p className="text-xs font-semibold text-amber-700">Media Geral</p>
              <p className="text-4xl font-extrabold text-amber-600">{stats.average}/5.0</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-md bg-blue-50 px-2 py-3">
                <p className="text-3xl font-extrabold text-blue-600">{stats.received}</p>
                <p className="text-xs text-slate-600">Recebidos</p>
              </div>
              <div className="rounded-md bg-emerald-50 px-2 py-3">
                <p className="text-3xl font-extrabold text-emerald-600">{stats.sent}</p>
                <p className="text-xs text-slate-600">Enviados</p>
              </div>
            </div>

            <div className="rounded-md bg-slate-100 px-2 py-3 text-center">
              <p className="text-xs text-slate-600">Total de Interacoes</p>
              <p className="text-2xl font-bold text-slate-800">{stats.sent + stats.received}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, History, Paperclip, Star } from "lucide-react";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { SendEmail } from "@/integrations/Core";
import PageHeader from "@/components/layout/PageHeader";
import FileUpload from "@/components/Feedback/FileUpload";

function classificationFromScore(score) {
  if (score < 2) return "Nao atende";
  if (score < 3) return "Atende abaixo";
  if (score < 4) return "Atende";
  if (score < 5) return "Supera parcialmente";
  return "Supera";
}

function scoreTone(score) {
  if (score < 2) return "bg-rose-100 text-rose-700";
  if (score < 3) return "bg-orange-100 text-orange-700";
  if (score < 4) return "bg-amber-100 text-amber-700";
  if (score < 5) return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function FeedbacksRetroativos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [form, setForm] = useState({
    tipo_avaliacao: "avaliacao_pontual",
    destinatario_email: "",
    data_ocorrido: "",
    nota: 3,
    descricao: "",
    anonimo: false,
    notificarEmail: true,
  });

  async function loadData() {
    const [me, allUsers, retroativos] = await Promise.all([
      User.me(),
      User.list(),
      Feedback.filter({ retroativo: true }, "-created_date", 1000),
    ]);
    setCurrentUser(me);
    setUsers(allUsers.filter((user) => user.email !== me.email));
    setRows(retroativos);
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === form.destinatario_email),
    [users, form.destinatario_email]
  );

  function onChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    if (!currentUser) return;
    if (!form.destinatario_email || !form.descricao.trim() || !form.data_ocorrido) {
      window.alert("Preencha tipo, destinatario, data do evento e descricao.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        remetente_email: currentUser.email,
        remetente_nome: form.anonimo ? "Anonimo" : currentUser.full_name || currentUser.email,
        destinatario_email: form.destinatario_email,
        destinatario_nome: selectedUser?.full_name || form.destinatario_email,
        titulo: ["Evento Retroativo"],
        descricao: form.descricao.trim(),
        nota: Number(form.nota),
        classificacao: classificationFromScore(Number(form.nota)),
        tipo_avaliacao: form.tipo_avaliacao,
        retroativo: true,
        data_ocorrido: new Date(`${form.data_ocorrido}T12:00:00`).toISOString(),
        registrado_por_cargo: currentUser.cargo,
        status_email: form.notificarEmail ? "enviado" : "pendente",
      };

      await Feedback.create(payload);

      if (form.notificarEmail) {
        await SendEmail({
          to: payload.destinatario_email,
          subject: "Nova avaliacao retroativa registrada",
        });
      }

      setForm({
        tipo_avaliacao: "avaliacao_pontual",
        destinatario_email: "",
        data_ocorrido: "",
        nota: 3,
        descricao: "",
        anonimo: false,
        notificarEmail: true,
      });
      setUploadedFileName("");
      await loadData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Falha ao cadastrar avaliacao retroativa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={History}
        title="Avaliacoes Retroativas"
        subtitle="Use esta funcionalidade para registrar eventos importantes que aconteceram no passado."
      />

      <section className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        A data informada sera usada nas estatisticas e relatorios do sistema.
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Cadastrar Avaliacao Retroativa</div>
        <div className="fh-card-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="fh-field-label">Tipo da Avaliacao *</span>
              <select
                value={form.tipo_avaliacao}
                onChange={(event) => onChange("tipo_avaliacao", event.target.value)}
                className="fh-select"
              >
                <option value="avaliacao_pontual">Avaliacao Pontual</option>
                <option value="avaliacao_periodica">Avaliacao Periodica</option>
                <option value="feedback">Feedback</option>
                <option value="avaliacao_aic">Avaliacao A.I.C</option>
              </select>
            </label>

            <label className="block">
              <span className="fh-field-label">Para *</span>
              <select
                value={form.destinatario_email}
                onChange={(event) => onChange("destinatario_email", event.target.value)}
                className="fh-select"
              >
                <option value="">Selecione</option>
                {users.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block max-w-sm">
            <span className="fh-field-label">Data do Evento *</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={form.data_ocorrido}
                onChange={(event) => onChange("data_ocorrido", event.target.value)}
                className="fh-input pl-9"
              />
            </div>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="fh-field-label mb-0 inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" /> Nota da Avaliacao (0 a 5) *
              </p>
              <p className="text-2xl font-extrabold text-amber-600">{Number(form.nota).toFixed(1)}/5.0</p>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={form.nota}
              onChange={(event) => onChange("nota", Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-blue-100"
            />
            <div className={`rounded-md px-4 py-3 text-center text-sm font-bold ${scoreTone(Number(form.nota))}`}>
              {classificationFromScore(Number(form.nota))}
            </div>
          </div>

          <label className="block">
            <span className="fh-field-label">Descricao da Avaliacao *</span>
            <textarea
              value={form.descricao}
              onChange={(event) => onChange("descricao", event.target.value)}
              className="fh-textarea"
              placeholder="Descreva detalhadamente o evento e comportamentos observados..."
            />
          </label>

          <div>
            <p className="fh-field-label mb-1 inline-flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" /> Anexar Arquivos (Opcional)
            </p>
            <p className="mb-2 text-xs text-slate-500">Maximo recomendado: 10MB por arquivo.</p>
            <FileUpload onFileSelected={(file) => setUploadedFileName(file.name)} />
            {uploadedFileName ? <p className="mt-2 text-xs text-slate-600">Arquivo: {uploadedFileName}</p> : null}
          </div>

          <label className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.anonimo}
              onChange={(event) => onChange("anonimo", event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Enviar anonimamente</span>
              <span className="text-xs text-slate-600">O destinatario nao vera quem enviou esta avaliacao.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-md border border-blue-300 bg-blue-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.notificarEmail}
              onChange={(event) => onChange("notificarEmail", event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Notificar o colaborador por e-mail</span>
              <span className="text-xs text-slate-600">Recomendado para manter transparencia da avaliacao.</span>
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setForm({
                  tipo_avaliacao: "avaliacao_pontual",
                  destinatario_email: "",
                  data_ocorrido: "",
                  nota: 3,
                  descricao: "",
                  anonimo: false,
                  notificarEmail: true,
                })
              }
              className="fh-button-secondary"
            >
              Limpar Formulario
            </button>
            <button type="button" onClick={onSubmit} disabled={saving} className="fh-button-primary">
              {saving ? "Salvando..." : "Cadastrar Avaliacao"}
            </button>
          </div>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Historico Retroativo</div>
        <div className="fh-card-body overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2">Para</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Nota</th>
                <th className="px-2 py-2">Classificacao</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-600">
                    {new Date(item.data_ocorrido || item.created_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-2 py-2">{item.destinatario_nome || item.destinatario_email}</td>
                  <td className="px-2 py-2">{item.tipo_avaliacao || "feedback"}</td>
                  <td className="px-2 py-2">{Number(item.nota || 0).toFixed(1)}</td>
                  <td className="px-2 py-2">{item.classificacao || "-"}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-slate-500">
                    Nenhuma avaliacao retroativa cadastrada.
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

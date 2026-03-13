import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Paperclip, SendHorizontal, Star } from "lucide-react";
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

const TITULOS = ["Produtividade", "Conduta Pessoal", "Engajamento", "Desenvolvimento"];

export default function EnviarFeedback() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [form, setForm] = useState({
    setor: "",
    destinatario_email: "",
    tipo_avaliacao: "feedback",
    titulo: "Produtividade",
    funcao: "",
    descricao: "",
    nota: 3,
    anonimo: false,
    notificarEmail: true,
  });

  useEffect(() => {
    async function load() {
      const [me, allUsers] = await Promise.all([User.me(), User.list()]);
      setCurrentUser(me);
      setUsers(allUsers.filter((user) => user.email !== me.email));
    }
    load();
  }, []);

  const setorOptions = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.setor).filter(Boolean)));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!form.setor) return users;
    return users.filter((u) => u.setor === form.setor);
  }, [users, form.setor]);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === form.destinatario_email),
    [users, form.destinatario_email]
  );

  function onChange(key, value) {
    setSavedMessage("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleUserChange(email) {
    const target = users.find((u) => u.email === email);
    setForm((prev) => ({
      ...prev,
      destinatario_email: email,
      setor: target?.setor || prev.setor,
      funcao: target?.funcao || prev.funcao,
    }));
  }

  function resetForm() {
    setForm((prev) => ({
      ...prev,
      destinatario_email: "",
      tipo_avaliacao: "feedback",
      titulo: "Produtividade",
      descricao: "",
      nota: 3,
      anonimo: false,
      notificarEmail: true,
    }));
    setUploadedFileName("");
  }

  async function saveFeedback({ asDraft }) {
    if (!currentUser) return;

    if (!form.destinatario_email || !form.descricao.trim()) {
      window.alert("Preencha colaborador e descricao da avaliacao.");
      return;
    }

    setSending(true);
    setSavedMessage("");

    try {
      const payload = {
        remetente_email: currentUser.email,
        remetente_nome: form.anonimo ? "Anonimo" : currentUser.full_name || currentUser.email,
        destinatario_email: form.destinatario_email,
        destinatario_nome: selectedUser?.full_name || form.destinatario_email,
        titulo: [form.titulo],
        descricao: form.descricao.trim(),
        nota: Number(form.nota),
        classificacao: classificationFromScore(Number(form.nota)),
        tipo_avaliacao: form.tipo_avaliacao,
        registrado_por_cargo: currentUser.cargo,
        retroativo: false,
        status_email: asDraft || !form.notificarEmail ? "pendente" : "enviado",
        status_avaliacao: asDraft ? "Rascunho" : "Enviada",
      };

      await Feedback.create(payload);

      if (!asDraft && form.notificarEmail) {
        await SendEmail({
          to: payload.destinatario_email,
          subject: `Nova avaliacao: ${form.titulo}`,
        });
      }

      setSavedMessage(asDraft ? "Rascunho salvo com sucesso." : "Avaliacao enviada com sucesso.");
      resetForm();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Falha ao salvar avaliacao");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={SendHorizontal}
        title="Enviar Avaliacao"
        subtitle="Preencha todos os campos para registrar uma nova avaliacao."
      />

      <section className="fh-card">
        <div className="fh-card-header">Identificacao do Colaborador</div>
        <div className="fh-card-body grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="fh-field-label">Setor *</span>
            <select
              value={form.setor}
              onChange={(event) => onChange("setor", event.target.value)}
              className="fh-select"
            >
              <option value="">Selecione um setor</option>
              {setorOptions.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="fh-field-label">Colaborador *</span>
            <select
              value={form.destinatario_email}
              onChange={(event) => handleUserChange(event.target.value)}
              className="fh-select"
            >
              <option value="">Selecione um colaborador</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="fh-field-label">Cargo *</span>
            <input
              value={selectedUser?.cargo || ""}
              className="fh-input"
              placeholder="Cargo do colaborador"
              readOnly
            />
          </label>

          <label className="block">
            <span className="fh-field-label">Funcao</span>
            <input
              value={form.funcao}
              onChange={(event) => onChange("funcao", event.target.value)}
              className="fh-input"
              placeholder="Funcao do colaborador"
            />
          </label>

          <label className="block">
            <span className="fh-field-label">Avaliador</span>
            <input value={currentUser?.full_name || "-"} className="fh-input" readOnly />
          </label>

          <label className="block">
            <span className="fh-field-label">Data</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={new Date().toLocaleDateString("pt-BR")}
                readOnly
                className="fh-input pl-9"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Detalhes da Avaliacao</div>
        <div className="fh-card-body space-y-4">
          <label className="block max-w-sm">
            <span className="fh-field-label">Tipo da Avaliacao *</span>
            <select
              value={form.tipo_avaliacao}
              onChange={(event) => onChange("tipo_avaliacao", event.target.value)}
              className="fh-select"
            >
              <option value="feedback">Feedback</option>
              <option value="avaliacao_pontual">Avaliacao Pontual</option>
              <option value="avaliacao_periodica">Avaliacao Periodica</option>
              <option value="avaliacao_aic">Avaliacao A.I.C</option>
            </select>
          </label>

          <label className="block max-w-sm">
            <span className="fh-field-label">Titulo da Avaliacao *</span>
            <select
              value={form.titulo}
              onChange={(event) => onChange("titulo", event.target.value)}
              className="fh-select"
            >
              {TITULOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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
              placeholder="Seja especifico e construtivo..."
            />
          </label>

          <div>
            <p className="fh-field-label mb-1 inline-flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" /> Anexar Arquivos (Opcional)
            </p>
            <p className="mb-2 text-xs text-slate-500">
              Anexe documentos, prints ou evidencias que comprovem a avaliacao.
            </p>
            <FileUpload onFileSelected={(file) => setUploadedFileName(file.name)} />
            {uploadedFileName ? <p className="mt-2 text-xs text-slate-600">Arquivo: {uploadedFileName}</p> : null}
          </div>

          <label className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.anonimo}
              onChange={(event) => onChange("anonimo", event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
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
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Notificar colaborador por e-mail</span>
              <span className="text-xs text-slate-600">
                Recomendado para que o colaborador seja informado sobre a avaliacao.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {savedMessage ? <p className="mr-auto text-sm font-semibold text-emerald-600">{savedMessage}</p> : null}
        <button
          type="button"
          onClick={() => saveFeedback({ asDraft: true })}
          disabled={sending}
          className="fh-button-secondary"
        >
          Salvar Rascunho
        </button>
        <button
          type="button"
          onClick={() => saveFeedback({ asDraft: false })}
          disabled={sending}
          className="fh-button-primary"
        >
          {sending ? "Enviando..." : "Enviar Avaliacao"}
        </button>
      </div>
    </div>
  );
}

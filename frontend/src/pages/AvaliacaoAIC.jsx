import React, { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Paperclip } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { SendEmail } from "@/integrations/Core";
import FileUpload from "@/components/Feedback/FileUpload";

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

function classFromScore(score) {
  if (score < 2) return "Nao atende";
  if (score < 3) return "Atende abaixo";
  if (score < 4) return "Atende";
  if (score < 5) return "Supera parcialmente";
  return "Supera";
}

export default function AvaliacaoAIC() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [form, setForm] = useState({
    setor: "",
    destinatario_email: "",
    funcao: "",
    observacoes: "",
    produtividade: 0,
    conduta: 0,
    engajamento: 0,
    anonimo: false,
  });

  useEffect(() => {
    async function load() {
      const [me, allUsers] = await Promise.all([User.me(), User.list()]);
      setCurrentUser(me);
      setUsers(allUsers.filter((user) => user.email !== me.email));
    }
    load();
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === form.destinatario_email),
    [users, form.destinatario_email]
  );

  const weightedAverage = useMemo(() => {
    const p = Number(form.produtividade || 0);
    const c = Number(form.conduta || 0);
    const e = Number(form.engajamento || 0);
    if (!p || !c || !e) return 0;
    return Number(((p * 2 + c + e) / 4).toFixed(2));
  }, [form.produtividade, form.conduta, form.engajamento]);

  function onChange(key, value) {
    setMessage("");
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleUserChange(email) {
    const target = users.find((user) => user.email === email);
    setForm((prev) => ({
      ...prev,
      destinatario_email: email,
      setor: target?.setor || prev.setor,
      funcao: target?.funcao || prev.funcao,
    }));
  }

  async function save(asDraft) {
    if (!currentUser) return;

    if (!form.destinatario_email || !form.produtividade || !form.conduta || !form.engajamento) {
      window.alert("Selecione colaborador e notas de todas as competencias.");
      return;
    }

    if (!form.observacoes.trim()) {
      window.alert("Preencha as observacoes da avaliacao.");
      return;
    }

    setSaving(true);
    try {
      const descricao = [
        `Produtividade: ${form.produtividade}/5`,
        `Conduta Pessoal: ${form.conduta}/5`,
        `Engajamento: ${form.engajamento}/5`,
        `\nObservacoes:\n${form.observacoes.trim()}`,
      ].join("\n");

      const payload = {
        remetente_email: currentUser.email,
        remetente_nome: form.anonimo ? "Anonimo" : currentUser.full_name || currentUser.email,
        destinatario_email: form.destinatario_email,
        destinatario_nome: selectedUser?.full_name || form.destinatario_email,
        titulo: ["Avaliacao A.I.C"],
        descricao,
        nota: weightedAverage,
        classificacao: classFromScore(weightedAverage),
        tipo_avaliacao: "avaliacao_aic",
        registrado_por_cargo: currentUser.cargo,
        status_avaliacao: asDraft ? "Rascunho" : "Enviada",
        status_email: asDraft ? "pendente" : "enviado",
      };

      await Feedback.create(payload);
      if (!asDraft) {
        await SendEmail({
          to: payload.destinatario_email,
          subject: "Nova avaliacao A.I.C cadastrada",
        });
      }

      setMessage(asDraft ? "Rascunho salvo com sucesso." : "Avaliacao A.I.C enviada com sucesso.");
      setForm((prev) => ({
        ...prev,
        destinatario_email: "",
        produtividade: 0,
        conduta: 0,
        engajamento: 0,
        observacoes: "",
        anonimo: false,
      }));
      setUploadedFileName("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Falha ao salvar avaliacao A.I.C");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={ClipboardCheck}
        title="Avaliacao A.I.C"
        subtitle="Analise Individual do Colaborador para registro de desempenho."
      />

      <section className="fh-card">
        <div className="fh-card-header">Identificacao</div>
        <div className="fh-card-body grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="fh-field-label">Setor</span>
            <input
              className="fh-input"
              value={form.setor}
              onChange={(event) => onChange("setor", event.target.value)}
              placeholder="Selecione um setor"
            />
          </label>
          <label className="block">
            <span className="fh-field-label">Colaborador</span>
            <select
              className="fh-select"
              value={form.destinatario_email}
              onChange={(event) => handleUserChange(event.target.value)}
            >
              <option value="">Selecione um colaborador</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="fh-field-label">Cargo</span>
            <input className="fh-input" value={selectedUser?.cargo || ""} placeholder="Cargo" readOnly />
          </label>
          <label className="block">
            <span className="fh-field-label">Funcao</span>
            <input
              className="fh-input"
              value={form.funcao}
              onChange={(event) => onChange("funcao", event.target.value)}
              placeholder="Digite a funcao do colaborador"
            />
          </label>
          <label className="block">
            <span className="fh-field-label">Avaliador</span>
            <input className="fh-input" value={currentUser?.full_name || "-"} readOnly />
          </label>
          <label className="block">
            <span className="fh-field-label">Data</span>
            <input className="fh-input" value={new Date().toLocaleDateString("pt-BR")} readOnly />
          </label>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Quadro de Avaliacao de Competencias</div>
        <div className="fh-card-body space-y-4">
          <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">Sistema de Pesos na Avaliacao</p>
            <p className="mt-1">Produtividade = Peso 2 (impacto dobrado na media final).</p>
            <p>Demais competencias = Peso 1.</p>
            <p className="mt-2 text-xs">
              Formula: ((Produtividade x 2) + Conduta + Engajamento) / 4
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Competencia</th>
                  {SCORE_OPTIONS.map((value) => (
                    <th key={value} className="px-3 py-2 text-center">
                      {value}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "produtividade", label: "Produtividade", weight: "PESO 2" },
                  { key: "conduta", label: "Conduta Pessoal" },
                  { key: "engajamento", label: "Engajamento" },
                ].map((competencia) => (
                  <tr key={competencia.key} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-semibold text-slate-700">
                      {competencia.label}
                      {competencia.weight ? (
                        <span className="ml-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {competencia.weight}
                        </span>
                      ) : null}
                    </td>
                    {SCORE_OPTIONS.map((value) => (
                      <td key={value} className="px-3 py-3 text-center">
                        <input
                          type="radio"
                          name={competencia.key}
                          checked={Number(form[competencia.key]) === value}
                          onChange={() => onChange(competencia.key, value)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700">Resultado Final</p>
              <p className="text-2xl font-extrabold text-blue-700">
                {weightedAverage > 0 ? `${weightedAverage.toFixed(1)} - ${classFromScore(weightedAverage)}` : "Aguardando avaliacao..."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Para uso do gestor - Aprovacao/Observacoes</div>
        <div className="fh-card-body space-y-4">
          <label className="block">
            <span className="fh-field-label">Observacoes</span>
            <textarea
              className="fh-textarea"
              value={form.observacoes}
              onChange={(event) => onChange("observacoes", event.target.value)}
              placeholder="Digite aqui observacoes, pontos de melhoria e proximos passos..."
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
              <span className="text-xs text-slate-600">O destinatario nao vera quem enviou a avaliacao.</span>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {message ? <p className="mr-auto text-sm font-semibold text-emerald-600">{message}</p> : null}
            <button type="button" onClick={() => save(true)} disabled={saving} className="fh-button-secondary">
              Salvar Rascunho
            </button>
            <button type="button" onClick={() => save(false)} disabled={saving} className="fh-button-primary">
              {saving ? "Salvando..." : "Enviar Avaliacao"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

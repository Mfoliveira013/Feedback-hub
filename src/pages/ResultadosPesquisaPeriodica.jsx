import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Search } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { PeriodicSurvey } from "@/entities/PeriodicSurvey";

function createMockAnswers(row) {
  const base = [
    { question: "1.1 Entendimento das atividades", answer: "Sim" },
    { question: "1.2 Pontos de duvida", answer: "Nao respondido" },
    { question: "2.1 Integracao com a rotina", answer: "Boa" },
    { question: "2.2 Dificuldades iniciais", answer: "Nao respondido" },
    { question: "3.1 Integracao com a equipe", answer: "Muito boa" },
    { question: "3.2 Suporte recebido", answer: "Sim" },
    { question: "4.1 Expectativas iniciais", answer: "Sim" },
  ];

  if (row.periodo === "90") {
    return base.map((item, index) =>
      index % 2 === 0 ? item : { ...item, answer: "Parcial" }
    );
  }

  return base;
}

export default function ResultadosPesquisaPeriodica() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await PeriodicSurvey.list(5000);
      setRows(data);
    }
    load().catch((error) => {
      window.alert(error instanceof Error ? error.message : "Falha ao carregar resultados de pesquisa");
    });
  }, []);

  const filtered = useMemo(() => {
    const text = search.toLowerCase().trim();
    return rows
      .filter((row) => {
        if (!text) return true;
        return (
          String(row.colaborador_nome || "").toLowerCase().includes(text) ||
          String(row.colaborador_email || "").toLowerCase().includes(text)
        );
      })
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [rows, search]);

  return (
    <div className="fh-page">
      <PageHeader
        icon={BarChart3}
        title="Resultados das Pesquisas Periodicas"
        subtitle="Visualize todas as respostas dos formularios de integracao."
      />

      <section className="fh-card">
        <div className="fh-card-header">Filtros</div>
        <div className="fh-card-body">
          <label className="block">
            <span className="fh-field-label">Buscar por colaborador</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="fh-input pl-9"
                placeholder="Nome ou e-mail do colaborador"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {filtered.map((row) => {
          const answers = createMockAnswers(row);

          return (
            <article key={row.id} className="fh-card">
              <div className="fh-card-body space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">{row.colaborador_nome}</h3>
                    <p className="text-sm text-slate-600">{row.colaborador_email}</p>
                    <p className="text-sm text-slate-600">
                      Respondido em: {new Date(row.created_date).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="fh-chip bg-blue-100 text-blue-700">{row.periodo} dias</span>
                    <span className="fh-chip bg-emerald-100 text-emerald-700">Concluida</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  Enviado por: <strong>{row.remetente_nome}</strong> ({row.remetente_email})
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Respostas do Formulario:</p>
                  {answers.map((item) => (
                    <div key={item.question} className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-800">{item.question}</p>
                      <p className={`text-sm ${item.answer === "Nao respondido" ? "text-slate-400 italic" : "text-slate-700"}`}>
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 ? (
          <div className="fh-card p-10 text-center text-sm text-slate-500">
            Nenhum resultado de pesquisa encontrado.
          </div>
        ) : null}
      </section>
    </div>
  );
}

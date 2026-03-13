import React from "react";
import { BarChart3, CalendarDays, BriefcaseBusiness, Grid2x2, MessageCircle, UsersRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

const APPS = [
  {
    id: "talentos",
    title: "Banco de Talentos",
    description: "Sistema de gestao de candidatos e processos seletivos.",
    icon: BriefcaseBusiness,
    color: "bg-blue-500",
    action: "Acessar",
  },
  {
    id: "feedback",
    title: "Feedback Hub",
    description: "Sistema atual de avaliacoes e feedback corporativo.",
    icon: MessageCircle,
    color: "bg-indigo-500",
    tag: "Aplicativo Atual",
  },
  {
    id: "dashboard",
    title: "Dashboard Executivo",
    description: "Painel de indicadores gerenciais da empresa.",
    icon: BarChart3,
    color: "bg-violet-500",
    tag: "Em Breve",
  },
  {
    id: "dados",
    title: "Gestao de Dados Funcionarios",
    description: "Sistema de controle e organizacao de dados de funcionarios.",
    icon: Grid2x2,
    color: "bg-emerald-500",
    action: "Acessar",
  },
  {
    id: "agenda",
    title: "Agenda Corporativa",
    description: "Sistema de agendamento e gestao de reunioes.",
    icon: CalendarDays,
    color: "bg-orange-500",
    tag: "Em Breve",
  },
  {
    id: "portal",
    title: "Portal do Colaborador",
    description: "Central de servicos e informacoes para funcionarios.",
    icon: UsersRound,
    color: "bg-pink-500",
    tag: "Em Breve",
  },
];

export default function AppsNef() {
  return (
    <div className="fh-page">
      <PageHeader
        icon={Grid2x2}
        title="Todos os App's NEF"
        subtitle="Central de aplicacoes da Nabarrete & Ferro Advogados Associados"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {APPS.map((app) => {
          const Icon = app.icon;

          return (
            <article key={app.id} className="fh-card p-6 text-center">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white ${app.color}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-3xl font-extrabold text-slate-900">{app.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{app.description}</p>
              <div className="mt-5">
                {app.action ? (
                  <button type="button" className="fh-button-secondary text-xs">
                    {app.action}
                  </button>
                ) : null}
                {app.tag ? <span className="fh-chip bg-amber-100 text-amber-700">{app.tag}</span> : null}
              </div>
            </article>
          );
        })}
      </section>

      <section className="fh-card p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Grid2x2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-4xl font-extrabold text-slate-900">Ecossistema Digital NEF</h3>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-600">
          Estamos desenvolvendo novas solucoes para otimizar os processos internos e melhorar a experiencia de trabalho da equipe.
          Em breve, novos aplicativos serao disponibilizados nesta central.
        </p>
      </section>
    </div>
  );
}

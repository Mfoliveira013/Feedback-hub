import React from "react";
import { Link } from "react-router-dom";
import { House } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { createPageUrl } from "@/utils";

export default function Home() {
  return (
    <div className="fh-page">
      <PageHeader
        icon={House}
        title="Inicio"
        subtitle="Use o menu lateral para navegar nas funcionalidades do sistema."
      />
      <section className="fh-card p-6">
        <p className="text-sm text-slate-600">
          O dashboard principal concentra os indicadores e atalhos para as operacoes mais usadas.
        </p>
        <Link to={createPageUrl("Dashboard")} className="fh-button-primary mt-4 inline-flex">
          Ir para Dashboard
        </Link>
      </section>
    </div>
  );
}

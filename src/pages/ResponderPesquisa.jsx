import React from "react";
import { ClipboardList } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

export default function ResponderPesquisa() {
  return (
    <div className="fh-page">
      <PageHeader
        icon={ClipboardList}
        title="Responder Pesquisa"
        subtitle="Canal interno para registro de respostas de pesquisas periodicas."
      />
      <section className="fh-card p-6 text-sm text-slate-600">
        Estrutura preparada para futuras respostas externas de formularios periodicos.
      </section>
    </div>
  );
}

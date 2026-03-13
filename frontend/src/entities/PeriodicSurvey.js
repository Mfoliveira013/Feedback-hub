import { get, post } from "@/api/httpClient";

const PERIOD_TO_LABEL = {
  "7": "7 dias",
  "45": "45 dias",
  "90": "90 dias",
};

export const PeriodicSurvey = {
  async list(limit = 5000) {
    const rows = await get("/surveys/periodic", { limit });
    return Array.isArray(rows) ? rows : [];
  },

  async create(data) {
    const payload = {
      tipo_pesquisa: PERIOD_TO_LABEL[String(data.periodo || "")] || data.tipo_pesquisa || "7 dias",
      destinatario_email: data.colaborador_email,
      destinatario_nome: data.colaborador_nome || data.colaborador_email,
      remetente_email: data.remetente_email,
      remetente_nome: data.remetente_nome || data.remetente_email,
      status_email: data.status_email || "enviado",
      status: data.status || "Enviado",
    };
    return post("/surveys/periodic", payload);
  },
};


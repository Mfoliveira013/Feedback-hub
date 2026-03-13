import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import {
  createPeriodicSurvey,
  createPeriodicSurveyResponse,
  listPeriodicSurveyResponses,
  listPeriodicSurveys,
} from "../repositories/surveys.repo.js";
import {
  canAccessSurveyRecordByScope,
  resolveSurveyVisibilityScope,
} from "../services/surveys-report-imports-scope.service.js";
import { recordAuditEvent } from "../utils/audit.js";

const router = Router();

const surveyCreateSchema = z.object({
  tipo_pesquisa: z.enum(["7 dias", "45 dias", "90 dias"]),
  data_envio: z.string().optional(),
  destinatario_user_id: z.number().optional(),
  destinatario_email: z.string().email(),
  destinatario_nome: z.string().optional(),
  destinatario_cargo: z.string().optional(),
  destinatario_setor: z.string().optional(),
  remetente_user_id: z.number().optional(),
  remetente_email: z.string().email(),
  remetente_nome: z.string().optional(),
  status_email: z.enum(["enviado", "falha", "pendente"]).optional(),
  motivo_falha_email: z.string().optional(),
  status: z.string().optional(),
});

const responseCreateSchema = z.object({
  pesquisa_id: z.number(),
  tipo_pesquisa: z.enum(["7 dias", "45 dias", "90 dias"]),
  data_resposta: z.string().optional(),
  colaborador_user_id: z.number().optional(),
  colaborador_email: z.string().email(),
  colaborador_nome: z.string().optional(),
  colaborador_cargo: z.string().optional(),
  colaborador_setor: z.string().optional(),
  remetente_user_id: z.number().optional(),
  remetente_email: z.string().email(),
  remetente_nome: z.string().optional(),
  respostas: z.array(z.any()),
  status: z.enum(["Concluida", "Pendente"]).optional(),
});

router.use(authRequired);

router.get("/periodic", async (req, res, next) => {
  try {
    const visibilityScope = await resolveSurveyVisibilityScope(req.user);
    const rows = await listPeriodicSurveys({
      limit: req.query.limit || 5000,
      scopeEmails: visibilityScope.mode !== "all" ? visibilityScope.scopeEmails : undefined,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/periodic", async (req, res, next) => {
  try {
    const visibilityScope = await resolveSurveyVisibilityScope(req.user);
    const parsed = surveyCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    if (!canAccessSurveyRecordByScope(visibilityScope, parsed.data)) {
      recordAuditEvent(req, {
        action: "survey_create",
        resource: "survey",
        result: "denied",
        reason: "scope_not_allowed",
        metadata: { destinatario_email: parsed.data.destinatario_email || null },
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    const created = await createPeriodicSurvey(parsed.data);
    recordAuditEvent(req, {
      action: "survey_create",
      resource: "survey",
      resourceId: created?.id ?? null,
      result: "success",
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.get("/periodic-responses", async (req, res, next) => {
  try {
    const visibilityScope = await resolveSurveyVisibilityScope(req.user);
    const rows = await listPeriodicSurveyResponses({
      limit: req.query.limit || 5000,
      scopeEmails: visibilityScope.mode !== "all" ? visibilityScope.scopeEmails : undefined,
    });
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/periodic-responses", async (req, res, next) => {
  try {
    const visibilityScope = await resolveSurveyVisibilityScope(req.user);
    const parsed = responseCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    if (!canAccessSurveyRecordByScope(visibilityScope, parsed.data)) {
      recordAuditEvent(req, {
        action: "survey_create",
        resource: "survey_response",
        result: "denied",
        reason: "scope_not_allowed",
        metadata: { colaborador_email: parsed.data.colaborador_email || null },
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    const created = await createPeriodicSurveyResponse(parsed.data);
    recordAuditEvent(req, {
      action: "survey_create",
      resource: "survey_response",
      resourceId: created?.id ?? null,
      result: "success",
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

export default router;


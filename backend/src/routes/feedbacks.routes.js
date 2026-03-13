import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import {
  createFeedback,
  deleteFeedback,
  findFeedbackById,
  listFeedbacks,
  updateFeedback,
} from "../repositories/feedbacks.repo.js";
import {
  canAccessFeedbackByScope,
  resolveFeedbackVisibilityScope,
} from "../services/feedback-scope.service.js";
import { recordAuditEvent } from "../utils/audit.js";

const router = Router();

const feedbackCreateSchema = z.object({
  data_ocorrido: z.string().optional(),
  remetente_user_id: z.number().optional(),
  remetente_email: z.string().default(""),
  remetente_nome: z.string().default(""),
  destinatario_user_id: z.number().optional(),
  destinatario_email: z.string().default(""),
  destinatario_nome: z.string().default(""),
  destinatario_setor: z.string().optional(),
  tipo_avaliacao: z.string().default("feedback"),
  titulo: z.array(z.string()).default([]),
  descricao: z.string().default(""),
  nota: z.coerce.number().default(0),
  classificacao: z.string().optional(),
  anonimo: z.boolean().optional(),
  retroativo: z.boolean().optional(),
  registrado_por_cargo: z.string().optional(),
  status_email: z.string().optional(),
  motivo_falha_email: z.string().optional(),
  notificacao_manual_necessaria: z.boolean().optional(),
  status_avaliacao: z.string().optional(),
  enviado_por_admin_email: z.string().optional(),
  cargo_colaborador: z.string().optional(),
  funcao: z.string().optional(),
  nota_produtividade: z.coerce.number().optional(),
  nota_conduta: z.coerce.number().optional(),
  nota_engajamento: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  arquivos_anexados: z.array(z.any()).optional(),
});

const feedbackUpdateSchema = feedbackCreateSchema.partial();

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const visibilityScope = await resolveFeedbackVisibilityScope(req.user);
    const rows = await listFeedbacks({
      order: req.query.order || "-created_date",
      limit: req.query.limit || 1000,
      tipo_avaliacao: req.query.tipo_avaliacao || "",
      destinatario_email: req.query.destinatario_email || "",
      remetente_email: req.query.remetente_email || "",
      classificacao: req.query.classificacao || "",
      status_email: req.query.status_email || "",
      status_avaliacao: req.query.status_avaliacao || "",
      retroativo: req.query.retroativo,
      from_date: req.query.from_date || "",
      to_date: req.query.to_date || "",
      search: req.query.search || "",
      scopeSetores: visibilityScope.mode === "setor" ? visibilityScope.scopeSetores : undefined,
      scopeEmails: visibilityScope.mode !== "all" ? visibilityScope.scopeEmails : undefined,
    });
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const visibilityScope = await resolveFeedbackVisibilityScope(req.user);
    const parsed = feedbackCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    if (!canAccessFeedbackByScope(visibilityScope, parsed.data)) {
      recordAuditEvent(req, {
        action: "feedback_create",
        resource: "feedback",
        result: "denied",
        reason: "scope_not_allowed",
        metadata: { destinatario_email: parsed.data.destinatario_email || null },
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    const created = await createFeedback(parsed.data);
    recordAuditEvent(req, {
      action: "feedback_create",
      resource: "feedback",
      resourceId: created?.id ?? null,
      result: "success",
    });
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const visibilityScope = await resolveFeedbackVisibilityScope(req.user);
    const row = await findFeedbackById(Number(req.params.id));
    if (!row) return res.status(404).json({ message: "Feedback not found" });
    if (!canAccessFeedbackByScope(visibilityScope, row)) {
      recordAuditEvent(req, {
        action: "feedback_read",
        resource: "feedback",
        resourceId: row.id,
        result: "denied",
        reason: "scope_not_allowed",
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(row);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const visibilityScope = await resolveFeedbackVisibilityScope(req.user);
    const parsed = feedbackUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const existing = await findFeedbackById(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Feedback not found" });
    if (!canAccessFeedbackByScope(visibilityScope, existing)) {
      recordAuditEvent(req, {
        action: "feedback_update",
        resource: "feedback",
        resourceId: existing.id,
        result: "denied",
        reason: "scope_not_allowed_existing",
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const patchedCandidate = { ...existing, ...parsed.data };
    if (!canAccessFeedbackByScope(visibilityScope, patchedCandidate)) {
      recordAuditEvent(req, {
        action: "feedback_update",
        resource: "feedback",
        resourceId: existing.id,
        result: "denied",
        reason: "scope_not_allowed_patch",
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await updateFeedback(Number(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Feedback not found" });
    recordAuditEvent(req, {
      action: "feedback_update",
      resource: "feedback",
      resourceId: updated.id,
      result: "success",
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const visibilityScope = await resolveFeedbackVisibilityScope(req.user);
    const existing = await findFeedbackById(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Feedback not found" });
    if (!canAccessFeedbackByScope(visibilityScope, existing)) {
      recordAuditEvent(req, {
        action: "feedback_delete",
        resource: "feedback",
        resourceId: existing.id,
        result: "denied",
        reason: "scope_not_allowed",
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const ok = await deleteFeedback(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Feedback not found" });
    recordAuditEvent(req, {
      action: "feedback_delete",
      resource: "feedback",
      resourceId: existing.id,
      result: "success",
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;


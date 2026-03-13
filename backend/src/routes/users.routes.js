import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/permissions.js";
import {
  createUser,
  findUserById,
  listUsers,
  updateUser,
} from "../repositories/users.repo.js";
import { canAccessUserByScope, resolveUserVisibilityScope } from "../services/user-scope.service.js";
import { recordAuditEvent } from "../utils/audit.js";
import { toLegacyCargo } from "../utils/cargo.js";

const router = Router();

const userCreateSchema = z.object({
  email: z.string().email(),
  full_name: z.string().default(""),
  cargo: z
    .enum(["administrador", "gestor", "usuario", "admin_global", "admin_setor"])
    .default("usuario"),
  setor: z.string().optional(),
  funcao: z.string().optional(),
  filial: z.string().optional(),
  tema: z.enum(["claro", "escuro"]).default("claro"),
  foto_perfil: z.string().optional(),
  gerente_responsavel: z.string().optional(),
  gestores_responsaveis: z.array(z.string().email()).optional(),
  is_active: z.boolean().optional(),
});

const userUpdateSchema = userCreateSchema
  .omit({ email: true })
  .partial()
  .extend({
    gerente_responsavel_email: z.string().optional(),
  });

function normalizeUserPayloadCargo(payload = {}) {
  if (payload.cargo === undefined) return payload;
  return {
    ...payload,
    cargo: toLegacyCargo(payload.cargo),
  };
}

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const visibilityScope = await resolveUserVisibilityScope(req.user);
    const filters = {
      cargo: req.query.cargo || "",
      setor: req.query.setor || "",
      email: req.query.email || "",
      search: req.query.search || "",
    };
    if (visibilityScope.mode === "self") {
      filters.scopeUserId = visibilityScope.scopeUserId;
    } else if (visibilityScope.mode === "setores") {
      filters.scopeSetores = visibilityScope.scopeSetores;
    } else if (visibilityScope.mode === "emails") {
      filters.scopeEmails = visibilityScope.scopeEmails;
    }
    const rows = await listUsers(filters);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("admin_global", "admin_setor"), async (req, res, next) => {
  try {
    const visibilityScope = await resolveUserVisibilityScope(req.user);
    const parsed = userCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const userPayload = normalizeUserPayloadCargo(parsed.data);
    if (!canAccessUserByScope(visibilityScope, userPayload)) {
      recordAuditEvent(req, {
        action: "user_create",
        resource: "user",
        result: "denied",
        reason: "scope_not_allowed",
        metadata: { email: userPayload.email || null },
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const created = await createUser(userPayload);
    recordAuditEvent(req, {
      action: "user_create",
      resource: "user",
      resourceId: created?.id ?? null,
      result: "success",
    });
    return res.status(201).json(created);
  } catch (error) {
    if (String(error?.message || "").includes("uq_users_email")) {
      return res.status(409).json({ message: "Email ja cadastrado" });
    }
    return next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const user = await findUserById(Number(req.user.sub));
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", async (req, res, next) => {
  try {
    const parsed = userUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const updated = await updateUser(Number(req.user.sub), normalizeUserPayloadCargo(parsed.data));
    recordAuditEvent(req, {
      action: "user_update",
      resource: "user",
      resourceId: updated?.id ?? Number(req.user.sub),
      result: "success",
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const visibilityScope = await resolveUserVisibilityScope(req.user);
    const user = await findUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!canAccessUserByScope(visibilityScope, user)) {
      recordAuditEvent(req, {
        action: "user_read",
        resource: "user",
        resourceId: user.id,
        result: "denied",
        reason: "scope_not_allowed",
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", requireRole("admin_global", "admin_setor"), async (req, res, next) => {
  try {
    const visibilityScope = await resolveUserVisibilityScope(req.user);
    const parsed = userUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const existing = await findUserById(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "User not found" });
    if (!canAccessUserByScope(visibilityScope, existing)) {
      recordAuditEvent(req, {
        action: "user_update",
        resource: "user",
        resourceId: existing.id,
        result: "denied",
        reason: "scope_not_allowed_existing",
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const userPatch = normalizeUserPayloadCargo(parsed.data);
    const patchedCandidate = { ...existing, ...userPatch };
    if (!canAccessUserByScope(visibilityScope, patchedCandidate)) {
      recordAuditEvent(req, {
        action: "user_update",
        resource: "user",
        resourceId: existing.id,
        result: "denied",
        reason: "scope_not_allowed_patch",
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await updateUser(Number(req.params.id), userPatch);
    if (!updated) return res.status(404).json({ message: "User not found" });
    recordAuditEvent(req, {
      action: "user_update",
      resource: "user",
      resourceId: updated.id,
      result: "success",
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;


import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/permissions.js";
import {
  createReportImport,
  listReportImports,
} from "../repositories/report-imports.repo.js";
import { resolveReportImportVisibilityScope } from "../services/surveys-report-imports-scope.service.js";

const router = Router();

const reportImportSchema = z.object({
  imported_at: z.string().optional(),
  file_name: z.string().min(1),
  imported_by_user_id: z.number().optional(),
  imported_by_email: z.string().email(),
  rows: z.number().optional(),
  rows_count: z.number().optional(),
  columns: z.array(z.string()).optional(),
  type_distribution: z.record(z.number()).optional(),
  forced_type: z
    .enum(["feedback", "avaliacao_pontual", "avaliacao_periodica", "avaliacao_aic", "aic"])
    .optional(),
});

router.use(authRequired);

router.get("/", requireRole("admin_global", "admin_setor", "gestor"), async (req, res, next) => {
  try {
    const visibilityScope = await resolveReportImportVisibilityScope(req.user);
    const rows = await listReportImports({
      limit: req.query.limit || 50,
      scopeEmails: visibilityScope.mode !== "all" ? visibilityScope.scopeEmails : undefined,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("admin_global", "admin_setor", "gestor"), async (req, res, next) => {
  try {
    const parsed = reportImportSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const created = await createReportImport(parsed.data);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

export default router;


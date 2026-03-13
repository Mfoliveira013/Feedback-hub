import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import {
  getUserPreferences,
  upsertUserPreferences,
} from "../repositories/preferences.repo.js";

const router = Router();

const patchSchema = z.object({
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

router.use(authRequired);

router.get("/me", async (req, res, next) => {
  try {
    const preferences = await getUserPreferences(Number(req.user.sub));
    return res.json(preferences);
  } catch (error) {
    return next(error);
  }
});

router.put("/me", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const updated = await upsertUserPreferences(Number(req.user.sub), parsed.data);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;


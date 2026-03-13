import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { authRequired } from "../middleware/auth.js";
import { findUserByEmail, findUserById, listUsers } from "../repositories/users.repo.js";
import { createAccessToken } from "../utils/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email().optional(),
});

async function resolveLoginUser(email) {
  if (email) {
    return findUserByEmail(email);
  }
  if (env.defaultLoginEmail) {
    const byEnv = await findUserByEmail(env.defaultLoginEmail);
    if (byEnv) return byEnv;
  }

  const users = await listUsers({});
  return users[0] || null;
}

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }

    const user = await resolveLoginUser(parsed.data.email || "");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "User is inactive" });
    }

    const token = createAccessToken(user);
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const userId = Number(req.user.sub);
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", authRequired, (_req, res) => {
  return res.json({ ok: true });
});

export default router;


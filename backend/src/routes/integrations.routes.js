import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
});

router.use(authRequired);

router.post("/send-email", async (req, res) => {
  const parsed = sendEmailSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  // eslint-disable-next-line no-console
  console.info("[SendEmail] Simulacao local", parsed.data);

  return res.json({
    ok: true,
    provider: "local-mock",
    sent_at: new Date().toISOString(),
  });
});

export default router;


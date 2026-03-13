import { Router } from "express";
import { dbQuery } from "../db/pool.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    await dbQuery("SELECT 1");
    res.json({
      ok: true,
      service: "feedback-hub-api",
      now: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;


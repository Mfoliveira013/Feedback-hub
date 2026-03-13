import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import feedbackRoutes from "./routes/feedbacks.routes.js";
import healthRoutes from "./routes/health.routes.js";
import integrationRoutes from "./routes/integrations.routes.js";
import preferencesRoutes from "./routes/preferences.routes.js";
import reportImportRoutes from "./routes/report-imports.routes.js";
import surveyRoutes from "./routes/surveys.routes.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin.split(",").map((item) => item.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "feedback-hub-api" });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/report-imports", reportImportRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/integrations", integrationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;


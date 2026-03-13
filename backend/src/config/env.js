import dotenv from "dotenv";

dotenv.config();

function required(key, fallback = "") {
  const value = process.env[key] ?? fallback;
  if (value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: required("JWT_SECRET", "change-this-in-production"),
  defaultLoginEmail: process.env.DEFAULT_LOGIN_EMAIL || "",
  mysql: {
    host: required("MYSQL_HOST", "127.0.0.1"),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: required("MYSQL_USER", "root"),
    password: process.env.MYSQL_PASSWORD || "",
    database: required("MYSQL_DATABASE", "feedback_hub"),
  },
};


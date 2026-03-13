import mysql from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  connectionLimit: 12,
  waitForConnections: true,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: "utf8mb4",
});

export async function dbQuery(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}


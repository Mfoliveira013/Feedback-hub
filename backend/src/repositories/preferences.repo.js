import { pool } from "../db/pool.js";

const DEFAULT_PREFERENCES = {
  language: "pt-BR",
  emailNotifications: true,
  pushNotifications: false,
};

function mapPreferenceRow(row) {
  if (!row) return { ...DEFAULT_PREFERENCES };
  return {
    language: row.language || "pt-BR",
    emailNotifications: Boolean(row.email_notifications),
    pushNotifications: Boolean(row.push_notifications),
  };
}

export async function getUserPreferences(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM user_preferences WHERE user_id = ?",
    [userId]
  );
  return mapPreferenceRow(rows[0]);
}

export async function upsertUserPreferences(userId, patch = {}) {
  const current = await getUserPreferences(userId);
  const next = {
    language: patch.language ?? current.language,
    emailNotifications:
      patch.emailNotifications === undefined
        ? current.emailNotifications
        : Boolean(patch.emailNotifications),
    pushNotifications:
      patch.pushNotifications === undefined
        ? current.pushNotifications
        : Boolean(patch.pushNotifications),
  };

  await pool.query(
    `INSERT INTO user_preferences (user_id, language, email_notifications, push_notifications)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       language = VALUES(language),
       email_notifications = VALUES(email_notifications),
       push_notifications = VALUES(push_notifications)`,
    [userId, next.language, next.emailNotifications ? 1 : 0, next.pushNotifications ? 1 : 0]
  );

  return next;
}


-- Feedback Hub - MySQL 8+
-- Migration: 002_user_setores.up.sql

USE feedback_hub;

CREATE TABLE IF NOT EXISTS user_setores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  setor VARCHAR(120) NOT NULL,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_setores_user_setor (user_id, setor),
  KEY idx_user_setores_user (user_id),
  KEY idx_user_setores_setor (setor),
  CONSTRAINT fk_user_setores_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

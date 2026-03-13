-- Feedback Hub - MySQL 8+
-- Migration: 001_create_schema.up.sql

CREATE DATABASE IF NOT EXISTS feedback_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE feedback_hub;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  cargo ENUM('administrador', 'gestor', 'usuario') NOT NULL DEFAULT 'usuario',
  setor VARCHAR(120) NULL,
  funcao VARCHAR(120) NULL,
  filial VARCHAR(120) NULL,
  tema ENUM('claro', 'escuro') NOT NULL DEFAULT 'claro',
  foto_perfil VARCHAR(1024) NULL,
  gerente_responsavel_email VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_cargo_setor (cargo, setor),
  KEY idx_users_setor (setor),
  KEY idx_users_full_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_gestores (
  user_id BIGINT UNSIGNED NOT NULL,
  gestor_user_id BIGINT UNSIGNED NOT NULL,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, gestor_user_id),
  KEY idx_user_gestores_gestor (gestor_user_id),
  CONSTRAINT fk_user_gestores_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_gestores_gestor
    FOREIGN KEY (gestor_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedbacks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  data_ocorrido DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  remetente_user_id BIGINT UNSIGNED NULL,
  remetente_email VARCHAR(255) NOT NULL,
  remetente_nome VARCHAR(255) NULL,

  destinatario_user_id BIGINT UNSIGNED NULL,
  destinatario_email VARCHAR(255) NOT NULL,
  destinatario_nome VARCHAR(255) NULL,
  destinatario_setor VARCHAR(120) NULL,

  tipo_avaliacao ENUM('feedback', 'avaliacao_pontual', 'avaliacao_periodica', 'avaliacao_aic', 'aic')
    NOT NULL DEFAULT 'feedback',
  titulo_json JSON NOT NULL,
  titulo_first VARCHAR(120)
    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(titulo_json, '$[0]'))) STORED,
  descricao LONGTEXT NOT NULL,
  nota DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  classificacao VARCHAR(80) NULL,
  anonimo TINYINT(1) NOT NULL DEFAULT 0,
  retroativo TINYINT(1) NOT NULL DEFAULT 0,
  registrado_por_cargo VARCHAR(40) NULL,

  status_email ENUM('enviado', 'falha', 'pendente', 'nao_enviado') NOT NULL DEFAULT 'pendente',
  motivo_falha_email TEXT NULL,
  notificacao_manual_necessaria TINYINT(1) NOT NULL DEFAULT 0,

  status_avaliacao ENUM('Rascunho', 'Enviada') NOT NULL DEFAULT 'Rascunho',
  enviado_por_admin_email VARCHAR(255) NULL,

  cargo_colaborador VARCHAR(120) NULL,
  funcao VARCHAR(120) NULL,
  nota_produtividade DECIMAL(4,2) NULL,
  nota_conduta DECIMAL(4,2) NULL,
  nota_engajamento DECIMAL(4,2) NULL,
  observacoes TEXT NULL,
  arquivos_anexados_json JSON NULL,

  PRIMARY KEY (id),
  KEY idx_feedbacks_created_date (created_date),
  KEY idx_feedbacks_data_ocorrido (data_ocorrido),
  KEY idx_feedbacks_tipo (tipo_avaliacao),
  KEY idx_feedbacks_titulo_first (titulo_first),
  KEY idx_feedbacks_destinatario_data (destinatario_user_id, data_ocorrido),
  KEY idx_feedbacks_destinatario_email_data (destinatario_email, data_ocorrido),
  KEY idx_feedbacks_remetente_data (remetente_user_id, data_ocorrido),
  KEY idx_feedbacks_remetente_email_data (remetente_email, data_ocorrido),
  KEY idx_feedbacks_classificacao (classificacao),
  KEY idx_feedbacks_status_email (status_email),
  KEY idx_feedbacks_status_avaliacao (status_avaliacao),
  KEY idx_feedbacks_retroativo_data (retroativo, data_ocorrido),
  CONSTRAINT fk_feedbacks_remetente
    FOREIGN KEY (remetente_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_feedbacks_destinatario
    FOREIGN KEY (destinatario_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_feedbacks_nota CHECK (nota >= 0 AND nota <= 5),
  CONSTRAINT chk_feedbacks_nota_prod CHECK (nota_produtividade IS NULL OR (nota_produtividade >= 0 AND nota_produtividade <= 5)),
  CONSTRAINT chk_feedbacks_nota_cond CHECK (nota_conduta IS NULL OR (nota_conduta >= 0 AND nota_conduta <= 5)),
  CONSTRAINT chk_feedbacks_nota_eng CHECK (nota_engajamento IS NULL OR (nota_engajamento >= 0 AND nota_engajamento <= 5)),
  CONSTRAINT chk_feedbacks_titulo_json CHECK (JSON_VALID(titulo_json)),
  CONSTRAINT chk_feedbacks_arquivos_json CHECK (arquivos_anexados_json IS NULL OR JSON_VALID(arquivos_anexados_json))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS periodic_surveys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  data_envio DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  tipo_pesquisa ENUM('7 dias', '45 dias', '90 dias') NOT NULL,

  destinatario_user_id BIGINT UNSIGNED NULL,
  destinatario_email VARCHAR(255) NOT NULL,
  destinatario_nome VARCHAR(255) NULL,
  destinatario_cargo VARCHAR(120) NULL,
  destinatario_setor VARCHAR(120) NULL,

  remetente_user_id BIGINT UNSIGNED NULL,
  remetente_email VARCHAR(255) NOT NULL,
  remetente_nome VARCHAR(255) NULL,

  status_email ENUM('enviado', 'falha', 'pendente') NOT NULL DEFAULT 'pendente',
  motivo_falha_email TEXT NULL,
  status ENUM('Enviado', 'Concluida', 'Pendente') NOT NULL DEFAULT 'Enviado',

  PRIMARY KEY (id),
  KEY idx_periodic_surveys_data_envio (data_envio),
  KEY idx_periodic_surveys_tipo (tipo_pesquisa),
  KEY idx_periodic_surveys_destinatario (destinatario_user_id),
  KEY idx_periodic_surveys_destinatario_email (destinatario_email),
  KEY idx_periodic_surveys_remetente (remetente_user_id),
  CONSTRAINT fk_periodic_surveys_destinatario
    FOREIGN KEY (destinatario_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_periodic_surveys_remetente
    FOREIGN KEY (remetente_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS periodic_survey_responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  data_resposta DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  pesquisa_id BIGINT UNSIGNED NOT NULL,
  tipo_pesquisa ENUM('7 dias', '45 dias', '90 dias') NOT NULL,

  colaborador_user_id BIGINT UNSIGNED NULL,
  colaborador_email VARCHAR(255) NOT NULL,
  colaborador_nome VARCHAR(255) NULL,
  colaborador_cargo VARCHAR(120) NULL,
  colaborador_setor VARCHAR(120) NULL,

  remetente_user_id BIGINT UNSIGNED NULL,
  remetente_email VARCHAR(255) NOT NULL,
  remetente_nome VARCHAR(255) NULL,

  respostas_json JSON NOT NULL,
  status ENUM('Concluida', 'Pendente') NOT NULL DEFAULT 'Concluida',

  PRIMARY KEY (id),
  KEY idx_periodic_survey_responses_pesquisa (pesquisa_id),
  KEY idx_periodic_survey_responses_data (data_resposta),
  KEY idx_periodic_survey_responses_tipo (tipo_pesquisa),
  KEY idx_periodic_survey_responses_colaborador (colaborador_user_id),
  KEY idx_periodic_survey_responses_colaborador_email (colaborador_email),
  CONSTRAINT fk_periodic_survey_responses_pesquisa
    FOREIGN KEY (pesquisa_id) REFERENCES periodic_surveys(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_periodic_survey_responses_colaborador
    FOREIGN KEY (colaborador_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_periodic_survey_responses_remetente
    FOREIGN KEY (remetente_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_periodic_survey_respostas_json CHECK (JSON_VALID(respostas_json))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_imports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  imported_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  file_name VARCHAR(255) NOT NULL,
  imported_by_user_id BIGINT UNSIGNED NULL,
  imported_by_email VARCHAR(255) NOT NULL,

  rows_count INT UNSIGNED NOT NULL DEFAULT 0,
  columns_json JSON NULL,
  type_distribution_json JSON NULL,

  forced_type ENUM('feedback', 'avaliacao_pontual', 'avaliacao_periodica', 'avaliacao_aic', 'aic') NULL,

  PRIMARY KEY (id),
  KEY idx_report_imports_imported_at (imported_at),
  KEY idx_report_imports_imported_by (imported_by_user_id),
  CONSTRAINT fk_report_imports_imported_by
    FOREIGN KEY (imported_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_report_imports_columns_json CHECK (columns_json IS NULL OR JSON_VALID(columns_json)),
  CONSTRAINT chk_report_imports_type_distribution_json CHECK (type_distribution_json IS NULL OR JSON_VALID(type_distribution_json))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT UNSIGNED NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  push_notifications TINYINT(1) NOT NULL DEFAULT 0,
  created_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- AIGraph baseline schema. Matches the tables the Spring Boot app maps with JPA.
-- ddl-auto is none: this file creates a new database; it does not alter an existing one.
-- Charset follows the server default, utf8mb4 / utf8mb4_0900_ai_ci.

CREATE TABLE IF NOT EXISTS app_lock (
  id TINYINT PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO app_lock (id) VALUES (1);

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(20) PRIMARY KEY,
  role VARCHAR(10) NOT NULL,
  salt CHAR(32) NOT NULL,
  password_hash CHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  last_login_at BIGINT NULL,
  must_change_password TINYINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  expires_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS learning_quiz (
  username VARCHAR(20) PRIMARY KEY,
  answers JSON NOT NULL,
  updated_at BIGINT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS learning_exams (
  username VARCHAR(20) NOT NULL,
  id CHAR(36) NOT NULL,
  body JSON NOT NULL,
  PRIMARY KEY (username, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS llm_settings (
  id TINYINT PRIMARY KEY,
  base_url VARCHAR(300) NOT NULL,
  model_name VARCHAR(80) NOT NULL,
  api_key VARCHAR(256) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_bank (
  id TINYINT PRIMARY KEY,
  version VARCHAR(80) NOT NULL,
  groups_json JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exam_questions (
  id VARCHAR(20) PRIMARY KEY,
  sort_order INT NOT NULL,
  body JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS theory_questions (
  id VARCHAR(20) PRIMARY KEY,
  kind VARCHAR(16) NOT NULL,
  sort_order INT NOT NULL,
  body JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

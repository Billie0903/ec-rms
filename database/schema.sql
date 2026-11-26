-- EC-RMS database schema (MySQL 8+, InnoDB, utf8mb4)
-- Import in phpMyAdmin (Import tab) or run: mysql -u <user> -p < database/schema.sql
-- See docs/ERD.md for the diagram and design notes.

CREATE DATABASE IF NOT EXISTS ec_rms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ec_rms;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, deletion_requests, weekly_summaries, schedules, care_notes,
  vital_signs, medications, health_conditions, allergies, resident_relatives, residents,
  account_invites, users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(255) NULL COMMENT 'bcrypt; NULL until the invite is activated',
  role           ENUM('admin','operator','relative') NOT NULL,
  status         ENUM('invited','active','disabled') NOT NULL DEFAULT 'invited',
  last_login_at  DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE account_invites (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL COMMENT 'SHA-256 hex of the raw token',
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_by  INT UNSIGNED NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invites_token (token_hash),
  CONSTRAINT fk_invites_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_invites_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Residents
-- ---------------------------------------------------------------------------
CREATE TABLE residents (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_code       VARCHAR(20)  NOT NULL,
  full_name           VARCHAR(100) NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              ENUM('male','female','other') NOT NULL,
  photo_url           VARCHAR(500) NULL,
  room                VARCHAR(20)  NULL,
  admission_date      DATE NOT NULL,
  status              ENUM('active','hospital','discharged','deceased','archived') NOT NULL DEFAULT 'active',
  mobility_level      ENUM('independent','walking_aid','wheelchair','bedridden') NOT NULL DEFAULT 'independent',
  fall_risk           ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  diet_notes          VARCHAR(255) NULL,
  cognitive_status    VARCHAR(255) NULL,
  primary_doctor      VARCHAR(100) NULL,
  preferred_hospital  VARCHAR(150) NULL,
  archived_at         DATETIME NULL,
  created_by          INT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_residents_code (resident_code),
  KEY idx_residents_status (status),
  KEY idx_residents_name (full_name),
  CONSTRAINT fk_residents_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Who may see which resident (the relative access-control table)
CREATE TABLE resident_relatives (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id           INT UNSIGNED NOT NULL,
  relative_user_id      INT UNSIGNED NOT NULL,
  relationship          VARCHAR(50) NOT NULL,
  access_level          ENUM('full','basic') NOT NULL DEFAULT 'basic',
  is_emergency_contact  BOOLEAN NOT NULL DEFAULT FALSE,
  is_legal_guardian     BOOLEAN NOT NULL DEFAULT FALSE,
  consent_recorded_at   DATETIME NOT NULL,
  consent_recorded_by   INT UNSIGNED NULL,
  consent_note          VARCHAR(255) NULL,
  active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_resident_relative (resident_id, relative_user_id),
  KEY idx_rr_relative (relative_user_id, active),
  CONSTRAINT fk_rr_resident FOREIGN KEY (resident_id)         REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rr_relative FOREIGN KEY (relative_user_id)    REFERENCES users(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_rr_consent  FOREIGN KEY (consent_recorded_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Care records
-- ---------------------------------------------------------------------------
CREATE TABLE allergies (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id  INT UNSIGNED NOT NULL,
  allergen     VARCHAR(100) NOT NULL,
  type         ENUM('drug','food','other') NOT NULL,
  reaction     VARCHAR(255) NULL,
  severity     ENUM('mild','moderate','severe') NOT NULL DEFAULT 'moderate',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_allergies_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE health_conditions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(150) NOT NULL,
  since_date   DATE NULL,
  notes        VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conditions_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE medications (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id    INT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  dosage         VARCHAR(50)  NOT NULL,
  route          ENUM('oral','injection','topical','inhaled','other') NOT NULL DEFAULT 'oral',
  times_of_day   JSON NOT NULL COMMENT 'e.g. ["08:00","20:00"]',
  instructions   VARCHAR(255) NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NULL,
  prescribed_by  VARCHAR(100) NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_meds_resident (resident_id, active),
  CONSTRAINT fk_meds_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT chk_meds_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

CREATE TABLE vital_signs (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id       INT UNSIGNED NOT NULL,
  measured_at       DATETIME NOT NULL,
  bp_systolic       SMALLINT UNSIGNED NULL,
  bp_diastolic      SMALLINT UNSIGNED NULL,
  pulse             SMALLINT UNSIGNED NULL,
  temperature_c     DECIMAL(4,1) NULL,
  spo2              TINYINT UNSIGNED NULL,
  weight_kg         DECIMAL(5,1) NULL,
  blood_sugar_mmol  DECIMAL(4,1) NULL,
  recorded_by       INT UNSIGNED NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_vitals_resident_time (resident_id, measured_at),
  CONSTRAINT fk_vitals_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vitals_user     FOREIGN KEY (recorded_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE care_notes (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id        INT UNSIGNED NOT NULL,
  category           ENUM('daily','health','incident','activity') NOT NULL DEFAULT 'daily',
  note               TEXT NOT NULL,
  visible_to_family  BOOLEAN NOT NULL DEFAULT FALSE,
  author_id          INT UNSIGNED NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_notes_resident_time (resident_id, created_at),
  CONSTRAINT fk_notes_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_author   FOREIGN KEY (author_id)   REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE schedules (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id  INT UNSIGNED NOT NULL,
  title        VARCHAR(150) NOT NULL,
  type         ENUM('activity','appointment','therapy','visit') NOT NULL DEFAULT 'activity',
  start_at     DATETIME NOT NULL,
  end_at       DATETIME NULL,
  location     VARCHAR(150) NULL,
  notes        VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_schedules_resident_time (resident_id, start_at),
  CONSTRAINT fk_schedules_resident FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT chk_schedules_time CHECK (end_at IS NULL OR end_at >= start_at)
) ENGINE=InnoDB;

CREATE TABLE weekly_summaries (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id   INT UNSIGNED NOT NULL,
  week_start    DATE NOT NULL,
  content       TEXT NOT NULL,
  source        ENUM('ai','staff') NOT NULL DEFAULT 'staff',
  published_at  DATETIME NULL COMMENT 'NULL = draft, not visible to relatives',
  published_by  INT UNSIGNED NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_summary_week (resident_id, week_start),
  CONSTRAINT fk_summaries_resident  FOREIGN KEY (resident_id)  REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT fk_summaries_publisher FOREIGN KEY (published_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Workflow and audit
-- ---------------------------------------------------------------------------
CREATE TABLE deletion_requests (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resident_id   INT UNSIGNED NOT NULL,
  requested_by  INT UNSIGNED NOT NULL,
  reason        VARCHAR(500) NOT NULL,
  status        ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  reviewed_by   INT UNSIGNED NULL,
  review_note   VARCHAR(500) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at   DATETIME NULL,
  KEY idx_dr_status (status, created_at),
  KEY idx_dr_resident (resident_id, status),
  CONSTRAINT fk_dr_resident  FOREIGN KEY (resident_id)  REFERENCES residents(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dr_requester FOREIGN KEY (requested_by) REFERENCES users(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_dr_reviewer  FOREIGN KEY (reviewed_by)  REFERENCES users(id)     ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id  INT UNSIGNED NULL,
  action         VARCHAR(50) NOT NULL COMMENT 'e.g. resident.create, resident.archive, user.promote, auth.login',
  entity_type    VARCHAR(50) NOT NULL,
  entity_id      INT UNSIGNED NULL,
  before_data    JSON NULL,
  after_data     JSON NULL,
  ip_address     VARCHAR(45) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_actor_time (actor_user_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

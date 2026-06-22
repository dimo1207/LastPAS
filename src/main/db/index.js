import { app } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'
import fs from 'fs'

let db

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1))
    ) STRICT;

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      session_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      validity_status TEXT NOT NULL DEFAULT 'invalid',
      coding_percentage INTEGER NOT NULL DEFAULT 0 CHECK (coding_percentage BETWEEN 0 AND 100),
      location_system TEXT,
      locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
      FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS responses (
      response_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      response_number INTEGER NOT NULL,
      card_number TEXT NOT NULL,
      response_text TEXT NOT NULL,
      inquiry_text TEXT,
      inquiry_prompt INTEGER CHECK (inquiry_prompt IN (0, 1)),
      orientation TEXT,
      touched_card INTEGER CHECK (touched_card IN (0, 1)),
      r_optimized TEXT,
      location_notes TEXT,
      location_variables TEXT,
      location_buttons TEXT,
      location_code TEXT,
      content_code TEXT,
      development_quality TEXT,
      form_quality TEXT,
      determinants TEXT,
      cognitive_special_scores TEXT,
      content_special_scores TEXT,
      coding_system TEXT,
      UNIQUE(session_id, response_number),
      FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS report_exports (
      export_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      export_format TEXT NOT NULL,
      export_status TEXT NOT NULL,
      file_name TEXT,
      file_path TEXT,
      deleted_at TEXT,
      FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS audit_log (
      audit_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      session_id TEXT,
      details_json TEXT
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_assessment_sessions_client_id
      ON assessment_sessions(client_id);

    CREATE INDEX IF NOT EXISTS idx_responses_session_id
      ON responses(session_id);

    CREATE INDEX IF NOT EXISTS idx_report_exports_session_id
      ON report_exports(session_id);

    CREATE INDEX IF NOT EXISTS idx_audit_log_session_id
      ON audit_log(session_id);
  `)
}

export function getDb() {
  if (db) return db

  const userDataPath = app.getPath('userData')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  const dbPath = path.join(userDataPath, 'lastpas.sqlite')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  ensureSchema(db)

  console.log('Database ready at:', dbPath)

  return db
}

export function getDbVersion() {
  const database = getDb()
  const row = database.prepare('SELECT sqlite_version() AS version').get()
  return row?.version ?? 'unknown'
}
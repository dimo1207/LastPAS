import { app } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'
import fs from 'fs'
import crypto from 'node:crypto'

let db

function ensureColumn(database, tableName, columnName, columnSql) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all()
  const exists = columns.some((column) => column.name === columnName)

  if (!exists) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`)
  }
}

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY,
      client_label TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1))
    ) STRICT;

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      session_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
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
      response_notes TEXT,
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

  ensureColumn(database, 'clients', 'client_label', 'client_label TEXT')
  ensureColumn(database, 'responses', 'response_notes', 'response_notes TEXT')
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`
}

function nowUtc() {
  return new Date().toISOString()
}

function normalizeOptionalText(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function normalizeRequiredText(value) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function normalizeNullableBooleanInteger(value) {
  if (value === null || value === undefined || value === '') return null
  return value ? 1 : 0
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

export function createSession(participantLabel) {
  const database = getDb()
  const normalizedLabel = normalizeRequiredText(participantLabel)

  if (!normalizedLabel) {
    return {
      ok: false,
      error: 'missing-participant-label'
    }
  }

  const run = database.transaction((label) => {
    const timestamp = nowUtc()
    const clientId = makeId('cli')
    const sessionId = makeId('sess')

    database.prepare(`
      INSERT INTO clients (
        client_id,
        client_label,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?)
    `).run(clientId, label, timestamp, timestamp)

    database.prepare(`
      INSERT INTO assessment_sessions (
        session_id,
        client_id,
        created_at,
        updated_at,
        status,
        validity_status,
        coding_percentage,
        location_system,
        locked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      clientId,
      timestamp,
      timestamp,
      'draft',
      'invalid',
      0,
      null,
      0
    )

    return {
      ok: true,
      session: {
        sessionId,
        clientId,
        participantLabel: label,
        clientLabel: label,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'draft',
        validityStatus: 'invalid',
        codingPercentage: '0%'
      }
    }
  })

  return run(normalizedLabel)
}

export function listRecentSessions(limit = 10) {
  const database = getDb()
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10))

  return database
    .prepare(`
      SELECT
        s.session_id AS sessionId,
        s.client_id AS clientId,
        c.client_label AS clientLabel,
        c.client_label AS participantLabel,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        s.status AS status,
        s.validity_status AS validityStatus
      FROM assessment_sessions s
      JOIN clients c
        ON c.client_id = s.client_id
      ORDER BY s.created_at DESC
      LIMIT ?
    `)
    .all(safeLimit)
}

export function listMenuAdministrations(limit = 50) {
  const database = getDb()
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))

  return database
    .prepare(`
      SELECT
        s.session_id AS sessionId,
        s.client_id AS clientId,
        COALESCE(c.client_label, '—') AS participantLabel,
        c.client_label AS clientLabel,
        s.created_at AS dateAdministered,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        s.status AS status,
        s.validity_status AS validityStatus,
        CASE
          WHEN COUNT(r.response_id) >= 14 THEN 'Valid'
          ELSE 'Invalid'
        END AS administrationStatus,
        CAST(s.coding_percentage AS TEXT) || '%' AS codingPercentage
      FROM assessment_sessions s
      JOIN clients c
        ON c.client_id = s.client_id
      LEFT JOIN responses r
        ON r.session_id = s.session_id
      GROUP BY
        s.session_id,
        s.client_id,
        c.client_label,
        s.created_at,
        s.updated_at,
        s.status,
        s.validity_status,
        s.coding_percentage
      ORDER BY s.created_at DESC
      LIMIT ?
    `)
    .all(safeLimit)
}

export function updateClientLabel(clientId, clientLabel) {
  const database = getDb()
  const normalizedLabel = clientLabel?.trim() || null
  const timestamp = nowUtc()

  const result = database
    .prepare(`
      UPDATE clients
      SET
        client_label = ?,
        updated_at = ?
      WHERE client_id = ?
    `)
    .run(normalizedLabel, timestamp, clientId)

  return {
    ok: result.changes > 0,
    clientId,
    clientLabel: normalizedLabel,
    updatedAt: timestamp
  }
}

export function updateSessionStatus(sessionId, status) {
  const database = getDb()
  const allowedStatuses = new Set(['draft', 'in_progress', 'complete'])

  if (!allowedStatuses.has(status)) {
    return {
      ok: false,
      error: 'invalid-status',
      sessionId,
      status
    }
  }

  const timestamp = nowUtc()

  const result = database
    .prepare(`
      UPDATE assessment_sessions
      SET
        status = ?,
        updated_at = ?
      WHERE session_id = ?
    `)
    .run(status, timestamp, sessionId)

  return {
    ok: result.changes > 0,
    sessionId,
    status,
    updatedAt: timestamp
  }
}

export function createResponse(input) {
  const database = getDb()
  const timestamp = nowUtc()

  const sessionId = input?.sessionId
  const responseNumber = Number(input?.responseNumber)
  const cardNumber = normalizeRequiredText(input?.cardNumber)
  const responseText = normalizeRequiredText(input?.responseText)

  if (!sessionId) {
    return {
      ok: false,
      error: 'missing-session-id'
    }
  }

  if (!Number.isInteger(responseNumber) || responseNumber < 1) {
    return {
      ok: false,
      error: 'invalid-response-number'
    }
  }

  if (!cardNumber) {
    return {
      ok: false,
      error: 'missing-card-number'
    }
  }

  if (!responseText) {
    return {
      ok: false,
      error: 'missing-response-text'
    }
  }

  const responseId = makeId('resp')

  try {
    const result = database
      .prepare(`
        INSERT INTO responses (
          response_id,
          session_id,
          created_at,
          updated_at,
          response_number,
          card_number,
          response_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        responseId,
        sessionId,
        timestamp,
        timestamp,
        responseNumber,
        cardNumber,
        responseText
      )

    return {
      ok: result.changes > 0,
      responseId,
      sessionId,
      responseNumber,
      cardNumber,
      responseText,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  } catch (error) {
    const message = String(error)

    if (message.includes('UNIQUE constraint failed: responses.session_id, responses.response_number')) {
      return {
        ok: false,
        error: 'duplicate-response-number',
        sessionId,
        responseNumber
      }
    }

    if (message.includes('FOREIGN KEY constraint failed')) {
      return {
        ok: false,
        error: 'invalid-session-id',
        sessionId
      }
    }

    throw error
  }
}

export function listResponsesForSession(sessionId) {
  const database = getDb()

  if (!sessionId) {
    return []
  }

  return database
    .prepare(`
      SELECT
        response_id AS responseId,
        session_id AS sessionId,
        created_at AS createdAt,
        updated_at AS updatedAt,
        response_number AS responseNumber,
        card_number AS cardNumber,
        response_text AS responseText,
        response_notes AS responseNotes,
        inquiry_text AS inquiryText,
        inquiry_prompt AS inquiryPrompt,
        orientation AS orientation,
        touched_card AS touchedCard,
        r_optimized AS rOptimized,
        location_notes AS locationNotes,
        location_variables AS locationVariables,
        location_buttons AS locationButtons,
        location_code AS locationCode,
        content_code AS contentCode,
        development_quality AS developmentQuality,
        form_quality AS formQuality,
        determinants AS determinants,
        cognitive_special_scores AS cognitiveSpecialScores,
        content_special_scores AS contentSpecialScores,
        coding_system AS codingSystem
      FROM responses
      WHERE session_id = ?
      ORDER BY response_number ASC, created_at ASC
    `)
    .all(sessionId)
}

export function updateResponse(responseId, input) {
  const database = getDb()
  const timestamp = nowUtc()

  if (!responseId) {
    return {
      ok: false,
      error: 'missing-response-id'
    }
  }

  const allowedFields = {
    response_number: (value) => {
      if (value === null || value === undefined || value === '') return undefined
      const num = Number(value)
      return Number.isInteger(num) && num >= 1 ? num : undefined
    },
    card_number: (value) => normalizeRequiredText(value),
    response_text: (value) => normalizeRequiredText(value),
    response_notes: (value) => normalizeOptionalText(value),
    inquiry_text: (value) => normalizeOptionalText(value),
    inquiry_prompt: (value) => normalizeNullableBooleanInteger(value),
    orientation: (value) => normalizeOptionalText(value),
    touched_card: (value) => normalizeNullableBooleanInteger(value),
    r_optimized: (value) => normalizeOptionalText(value),
    location_notes: (value) => normalizeOptionalText(value),
    location_variables: (value) => normalizeOptionalText(value),
    location_buttons: (value) => normalizeOptionalText(value),
    location_code: (value) => normalizeOptionalText(value),
    content_code: (value) => normalizeOptionalText(value),
    development_quality: (value) => normalizeOptionalText(value),
    form_quality: (value) => normalizeOptionalText(value),
    determinants: (value) => normalizeOptionalText(value),
    cognitive_special_scores: (value) => normalizeOptionalText(value),
    content_special_scores: (value) => normalizeOptionalText(value),
    coding_system: (value) => normalizeOptionalText(value)
  }

  const setParts = []
  const values = []
  const normalizedUpdates = {}

  for (const [field, normalize] of Object.entries(allowedFields)) {
    if (Object.prototype.hasOwnProperty.call(input ?? {}, field)) {
      const normalizedValue = normalize(input[field])

      if (normalizedValue !== undefined) {
        setParts.push(`${field} = ?`)
        values.push(normalizedValue)
        normalizedUpdates[field] = normalizedValue
      }
    }
  }

  if (setParts.length === 0) {
    return {
      ok: false,
      error: 'no-valid-fields',
      responseId
    }
  }

  setParts.push('updated_at = ?')
  values.push(timestamp)
  values.push(responseId)

  try {
    const result = database
      .prepare(`
        UPDATE responses
        SET ${setParts.join(', ')}
        WHERE response_id = ?
      `)
      .run(...values)

    return {
      ok: result.changes > 0,
      responseId,
      updatedAt: timestamp,
      updates: normalizedUpdates
    }
  } catch (error) {
    const message = String(error)

    if (message.includes('UNIQUE constraint failed: responses.session_id, responses.response_number')) {
      return {
        ok: false,
        error: 'duplicate-response-number',
        responseId
      }
    }

    throw error
  }
}

export function upsertResponse(input) {
  const database = getDb()
  const timestamp = nowUtc()

  const sessionId = String(input?.sessionId ?? "").trim()
  const responseNumber = Number(input?.responseNumber)
  const cardNumber = normalizeRequiredText(input?.cardNumber)
  const responseText = String(input?.responseText ?? "").trim()

  if (!sessionId) {
    return {
      ok: false,
      error: "missing-session-id"
    }
  }

  if (!Number.isInteger(responseNumber) || responseNumber < 1) {
    return {
      ok: false,
      error: "invalid-response-number"
    }
  }

  if (!cardNumber) {
    return {
      ok: false,
      error: "missing-card-number"
    }
  }

  const existing = database
    .prepare(`
      SELECT response_id AS responseId
      FROM responses
      WHERE session_id = ?
        AND response_number = ?
    `)
    .get(sessionId, responseNumber)

  if (existing?.responseId) {
    const result = database
      .prepare(`
        UPDATE responses
        SET
          card_number = ?,
          response_text = ?,
          response_notes = ?,
          inquiry_text = ?,
          orientation = ?,
          touched_card = ?,
          r_optimized = ?,
          updated_at = ?
        WHERE response_id = ?
      `)
      .run(
        cardNumber,
        responseText,
        normalizeOptionalText(input?.responseNotes),
        normalizeOptionalText(input?.inquiryText),
        normalizeOptionalText(input?.orientation),
        normalizeNullableBooleanInteger(input?.touchedCard),
        normalizeOptionalText(
          input?.rOptimized === true
            ? "true"
            : input?.rOptimized === false
            ? "false"
            : input?.rOptimized
        ),
        timestamp,
        existing.responseId
      )

    return {
      ok: result.changes > 0,
      mode: "update",
      responseId: existing.responseId,
      sessionId,
      responseNumber,
      updatedAt: timestamp
    }
  }

  const responseId = makeId("resp")

  const result = database
    .prepare(`
      INSERT INTO responses (
        response_id,
        session_id,
        created_at,
        updated_at,
        response_number,
        card_number,
        response_text,
        response_notes,
        inquiry_text,
        orientation,
        touched_card,
        r_optimized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      responseId,
      sessionId,
      timestamp,
      timestamp,
      responseNumber,
      cardNumber,
      responseText,
      normalizeOptionalText(input?.responseNotes),
      normalizeOptionalText(input?.inquiryText),
      normalizeOptionalText(input?.orientation),
      normalizeNullableBooleanInteger(input?.touchedCard),
      normalizeOptionalText(
        input?.rOptimized === true
          ? "true"
          : input?.rOptimized === false
          ? "false"
          : input?.rOptimized
      )
    )

  return {
    ok: result.changes > 0,
    mode: "create",
    responseId,
    sessionId,
    responseNumber,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

export function deleteResponse(responseId) {
  const database = getDb()

  if (!responseId) {
    return {
      ok: false,
      error: 'missing-response-id'
    }
  }

  const result = database
    .prepare(`
      DELETE FROM responses
      WHERE response_id = ?
    `)
    .run(responseId)

  return {
    ok: result.changes > 0,
    responseId
  }
}

export function deleteSession(sessionId) {
  const database = getDb()
  const normalizedSessionId = String(sessionId ?? '').trim()

  if (!normalizedSessionId) {
    return {
      ok: false,
      error: 'missing-session-id'
    }
  }

  const clientRow = database
    .prepare(`
      SELECT client_id AS clientId
      FROM assessment_sessions
      WHERE session_id = ?
    `)
    .get(normalizedSessionId)

  if (!clientRow?.clientId) {
    return {
      ok: false,
      error: 'session-not-found',
      sessionId: normalizedSessionId
    }
  }

  const result = database.transaction((targetSessionId, clientId) => {
    const deletedSession = database
      .prepare(`
        DELETE FROM assessment_sessions
        WHERE session_id = ?
      `)
      .run(targetSessionId)

    const deletedClient = database
      .prepare(`
        DELETE FROM clients
        WHERE client_id = ?
      `)
      .run(clientId)

    return {
      ok: deletedSession.changes > 0,
      sessionId: targetSessionId,
      clientId,
      deletedSessionRows: deletedSession.changes,
      deletedClientRows: deletedClient.changes
    }
  })(normalizedSessionId, clientRow.clientId)

  return result
}
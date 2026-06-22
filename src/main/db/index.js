import { app } from 'electron'
import path from 'path'
import Database from 'better-sqlite3'
import fs from 'fs'

let db

export function getDb() {
    if (db) return db

    const userDataPath = app.getPath('userData')
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
    }

    const dbPath = path.join(userDataPath, 'lastpas.sqlite')
    db = new Database(dbPath)

    db.pragma('journal_mode = WAL')
    db.prepare('SELECT 1').get()

    console.log('Database ready at:', dbPath)

    return db
}
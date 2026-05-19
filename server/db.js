import Database from 'better-sqlite3'
import { createClient } from '@libsql/client'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function createDb() {
  if (process.env.TURSO_DB_URL) {
    const client = createClient({
      url: process.env.TURSO_DB_URL,
      authToken: process.env.TURSO_DB_TOKEN,
    })
    return {
      type: 'turso',
      async all(sql, params) {
        const r = params ? await client.execute({ sql, args: params }) : await client.execute(sql)
        return r.rows
      },
      async get(sql, params) {
        const r = await client.execute({ sql, args: params })
        return r.rows[0]
      },
      async run(sql, params) {
        const r = await client.execute({ sql, args: params })
        return { lastInsertRowid: r.lastInsertRowid, changes: r.rowsAffected }
      },
      async exec(sql) {
        await client.execute(sql)
      },
      async batch(stmts) {
        await client.batch(stmts)
      },
      close() { client.close() }
    }
  }

  const DATA_DIR = join(__dirname, 'data')
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  const raw = new Database(join(DATA_DIR, 'tierrapy.sqlite'))
  raw.pragma('journal_mode = WAL')
  raw.pragma('foreign_keys = ON')

  return {
    type: 'sqlite',
    all(sql, params) { return params ? raw.prepare(sql).all(...params) : raw.prepare(sql).all() },
    get(sql, params) { return raw.prepare(sql).get(...(params || [])) },
    run(sql, params) { return raw.prepare(sql).run(...(params || [])) },
    exec(sql) { raw.exec(sql) },
    batch(stmts) {
      const tx = raw.transaction(() => stmts.forEach(s => raw.exec(s)))
      tx()
    },
    close() { raw.close() }
  }
}

const db = createDb()
export default db

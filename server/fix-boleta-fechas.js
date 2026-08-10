import { createClient } from '@libsql/client'

const url = process.env.TURSO_DB_URL
const token = process.env.TURSO_DB_TOKEN

if (!url || !token) {
  console.error('Faltan TURSO_DB_URL y TURSO_DB_TOKEN. Ejecutar con:')
  console.error('  $env:TURSO_DB_URL="..." ; $env:TURSO_DB_TOKEN="..." ; node fix-boleta-fechas.js')
  process.exit(1)
}

const client = createClient({ url, authToken: token })

function paraguayDate(isoUtc) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(isoUtc))
}

function utcDate(isoUtc) {
  return isoUtc ? isoUtc.slice(0, 10) : ''
}

const r = await client.execute('SELECT id, fecha, created_at FROM boletas')
let fixed = 0
let skipped = 0
for (const b of r.rows) {
  if (!b.created_at) { skipped++; continue }
  const u = utcDate(b.created_at)
  const p = paraguayDate(b.created_at)
  if (b.fecha === u && b.fecha !== p) {
    await client.execute({
      sql: 'UPDATE boletas SET fecha = ? WHERE id = ?',
      args: [p, b.id]
    })
    fixed++
    console.log(`boleta ${b.id} (${b.fecha} -> ${p})`)
  }
}
console.log(`Boletas corregidas: ${fixed} | sin created_at: ${skipped}`)
client.close()

import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const [,, project, password] = process.argv

const hosts = {
  fogao: { host: 'db.nfjyjnvmorwhikhczplp.supabase.co', password },
  scooby: { host: 'db.nufvtxhsckbaddurgcyx.supabase.co', password },
}

const cfg = hosts[project]
if (!cfg) { console.error('Use: node scripts/setup-db.js fogao <senha>'); process.exit(1) }

const client = new Client({
  host: cfg.host,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: cfg.password,
  ssl: { rejectUnauthorized: false },
})

const schemaPath = join(__dirname, '../supabase/schema.sql')
const sql = readFileSync(schemaPath, 'utf8')

console.log(`Conectando ao banco ${project}...`)
await client.connect()
console.log('Conectado! Executando schema...')
await client.query(sql)
console.log('Schema executado com sucesso!')
await client.end()

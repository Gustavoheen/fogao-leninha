import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

const client = new Client({
  host: 'db.nufvtxhsckbaddurgcyx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.argv[2],
  ssl: { rejectUnauthorized: false },
})

const sql = readFileSync('C:/Users/Gustavo/scooby-cardapio/supabase/schema.sql', 'utf8')

console.log('Conectando ao banco do Scooby...')
await client.connect()
console.log('Executando schema do Scooby...')
await client.query(sql)
console.log('Schema Scooby executado com sucesso!')
await client.end()

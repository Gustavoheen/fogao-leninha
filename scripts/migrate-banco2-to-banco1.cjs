/**
 * Migração de dados: Fogão a Lenha — banco2 → banco1 (schema fogao)
 *
 * Como usar:
 *   cd C:/Users/Gustavo/fogao-leninha
 *   node scripts/migrate-banco2-to-banco1.cjs
 */

const { createClient } = require('@supabase/supabase-js')

// Banco 2 (origem — fogao antigo) — leitura com anon key
// Tabelas privadas (despesas, estoque, etc.) precisam de service key
// do banco2 — obtida em: Supabase Dashboard → fogao-alenha → Settings → API → service_role
const BANCO2_URL = 'https://nfjyjnvmorwhikhczplp.supabase.co'
const BANCO2_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5manlqbnZtb3J3aGlraGN6cGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzY3MjMsImV4cCI6MjA4OTExMjcyM30.cUiDn1ZTqBAIVnaDkndrD_7zvAs4_T4JJ0QAwANTpkw'
// Para migrar tabelas privadas, cole aqui o service_role do banco2:
const BANCO2_SERVICE_KEY = process.env.BANCO2_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5manlqbnZtb3J3aGlraGN6cGxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzNjcyMywiZXhwIjoyMDg5MTEyNzIzfQ.fjiKVE9cWHFzHSoFvi2Tn8OQYT6QDZfQj6_T8Eg-Hu8'

// Banco 1 (destino — schema fogao)
const BANCO1_URL = 'https://nufvtxhsckbaddurgcyx.supabase.co'
const BANCO1_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZ0eGhzY2tiYWRkdXJnY3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzNTY3MiwiZXhwIjoyMDg5MTExNjcyfQ.uRWFqrBb25vzUcT0ve2TE8S08Nbt65FDNaduy_8jt0M'

// Tabelas públicas (anon pode ler)
const TABELAS_PUBLICAS = ['configuracoes', 'cardapio', 'cardapio_hoje', 'clientes', 'pedidos']
// Tabelas privadas (precisam de service key no banco2)
const TABELAS_PRIVADAS = ['despesas', 'estoque', 'fornecedores', 'funcionarios', 'motoboys']

const banco2Anon  = createClient(BANCO2_URL, BANCO2_ANON_KEY)
const banco2Svc   = BANCO2_SERVICE_KEY ? createClient(BANCO2_URL, BANCO2_SERVICE_KEY) : null
const banco1      = createClient(BANCO1_URL, BANCO1_SERVICE_KEY, { db: { schema: 'fogao' } })

async function migrarTabela(tabela, clienteLeitura) {
  if (!clienteLeitura) {
    console.log(`  ${tabela}: PULADA (service key do banco2 não configurada)`)
    return
  }
  process.stdout.write(`  Migrando ${tabela}... `)

  const { data, error } = await clienteLeitura.from(tabela).select('*')
  if (error) {
    console.log(`ERRO leitura: ${error.message}`)
    return
  }
  if (!data || data.length === 0) {
    console.log('vazia (nada a migrar)')
    return
  }

  const LOTE = 100
  let total = 0
  for (let i = 0; i < data.length; i += LOTE) {
    const lote = data.slice(i, i + LOTE)
    const { error: insErr } = await banco1.from(tabela).upsert(lote, { ignoreDuplicates: false })
    if (insErr) {
      console.log(`ERRO inserção: ${insErr.message}`)
      return
    }
    total += lote.length
  }
  console.log(`OK (${total} registros)`)
}

async function main() {
  console.log('\n=== Migração Fogão: Banco2 → Banco1/schema:fogao ===\n')

  console.log('[ Tabelas públicas ]')
  for (const t of TABELAS_PUBLICAS) await migrarTabela(t, banco2Anon)

  console.log('\n[ Tabelas privadas ]')
  if (!banco2Svc) {
    console.log('  Para migrar tabelas privadas, execute com:')
    console.log('  BANCO2_SERVICE_KEY="<service_role_do_banco2>" node scripts/migrate-banco2-to-banco1.cjs')
    console.log('  (service_role: Supabase Dashboard → fogao-alenha → Settings → API)')
  }
  for (const t of TABELAS_PRIVADAS) await migrarTabela(t, banco2Svc)

  console.log('\n✓ Script concluído!')
  console.log('\nPróximos passos:')
  console.log('  1. Verifique os dados no Supabase dashboard (banco1 → schema fogao)')
  console.log('  2. Atualize as env vars do fogao-leninha no Vercel:')
  console.log('     VITE_SUPABASE_URL=https://nufvtxhsckbaddurgcyx.supabase.co')
  console.log('     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZ0eGhzY2tiYWRkdXJnY3l4Iiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.e8bc22iMN30lKQIJSx4MpVgS-NKB0jEvB7hDhN1eg0o')
  console.log('  3. Deploy: git push origin master')
}

main().catch(err => {
  console.error('\nErro fatal:', err)
  process.exit(1)
})

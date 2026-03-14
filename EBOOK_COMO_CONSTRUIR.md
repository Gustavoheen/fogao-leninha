# Como Construir um Ecossistema Digital para Restaurantes
## Do PDV ao Bot com IA — Guia Técnico Completo

> Gustavo — versão 1.0 — Março 2026

---

## Parte 1 — App de Gestão PDV Online (PWA)

### O que você vai construir
Um sistema de gestão rodando no navegador, instalável como app desktop via Chrome,
com dados na nuvem e acesso de qualquer dispositivo.

---

### Passo 1 — Criar conta no Supabase

1. Acesse supabase.com → "Start for free"
2. Crie um projeto (ex: "fogao-leninha")
3. Guarde as credenciais: `Project URL` e `anon public key`
4. No painel, vá em **Table Editor** e crie as tabelas:

```sql
-- Restaurantes (um por cliente)
create table restaurantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique not null,
  criado_em timestamptz default now()
);

-- Clientes do restaurante
create table clientes (
  id bigint primary key generated always as identity,
  restaurante_id uuid references restaurantes(id),
  nome text, telefone text, rua text, bairro text,
  numero text, referencia text, tipo text default 'normal',
  observacoes text, criado_em timestamptz default now()
);

-- Pedidos
create table pedidos (
  id bigint primary key generated always as identity,
  restaurante_id uuid references restaurantes(id),
  cliente_id bigint references clientes(id),
  cliente_nome text,
  itens jsonb,
  total numeric,
  pagamento text,
  status text default 'aberto',
  status_pagamento text default 'pago',
  horario_entrega text,
  motoboy text,
  observacoes text,
  comanda_impressa_em timestamptz,
  criado_em timestamptz default now()
);

-- (repetir para cardapio, despesas, estoque, fornecedores, funcionarios)
```

5. Ative **Row Level Security (RLS)** em cada tabela para que cada restaurante só veja seus dados

---

### Passo 2 — Instalar Supabase no projeto React

```bash
npm install @supabase/supabase-js
```

Crie o arquivo `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Crie `.env.local` na raiz:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### Passo 3 — Substituir localStorage pelo Supabase

Antes (localStorage):
```js
function adicionarPedido(dados) {
  const novo = { id: Date.now(), ...dados }
  setPedidos(prev => [novo, ...prev])
}
```

Depois (Supabase):
```js
async function adicionarPedido(dados) {
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ ...dados, restaurante_id: user.restauranteId })
    .select()
    .single()
  if (!error) setPedidos(prev => [data, ...prev])
}
```

Para carregar dados em tempo real (pedidos aparecem sem recarregar):
```js
useEffect(() => {
  // Carrega pedidos iniciais
  supabase.from('pedidos').select('*').then(({ data }) => setPedidos(data))

  // Escuta novos pedidos em tempo real
  const canal = supabase
    .channel('pedidos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
      payload => {
        if (payload.eventType === 'INSERT') setPedidos(prev => [payload.new, ...prev])
        if (payload.eventType === 'UPDATE') setPedidos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        if (payload.eventType === 'DELETE') setPedidos(prev => prev.filter(p => p.id !== payload.old.id))
      }
    ).subscribe()

  return () => supabase.removeChannel(canal)
}, [])
```

---

### Passo 4 — Adicionar autenticação (login por restaurante)

```js
// Login
const { error } = await supabase.auth.signInWithPassword({
  email: 'leninha@fogao.com',
  password: 'senha123'
})

// Logout
await supabase.auth.signOut()

// Verificar se está logado
const { data: { session } } = await supabase.auth.getSession()
```

Proteja as rotas no React:
```jsx
function RotaProtegida({ children }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" />
  return children
}
```

---

### Passo 5 — Deploy na Vercel

1. Suba o código para GitHub
2. Acesse vercel.com → "New Project" → selecione o repositório
3. Adicione as variáveis de ambiente (`VITE_SUPABASE_URL` etc)
4. Clique em Deploy — URL gerada automaticamente
5. Para domínio próprio: compre em registro.br (~R$40/ano) e aponte para a Vercel

---

### Passo 6 — Tornar o app instalável (PWA)

Instale o plugin:
```bash
npm install -D vite-plugin-pwa
```

Configure em `vite.config.js`:
```js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Fogão a Lenha — Gestão',
        short_name: 'Fogão PDV',
        theme_color: '#92400e',
        background_color: '#fffbeb',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      }
    })
  ]
}
```

Resultado: Chrome mostra "Instalar aplicativo" → usuário clica → vira app no desktop.

---

## Parte 2 — Site de Pedidos Online

### Passo 1 — Criar o site público

Novo projeto React separado (ou subpasta `/pedidos` no mesmo projeto).

O site lê o cardápio do dia diretamente do Supabase:
```js
const { data: cardapio } = await supabase
  .from('cardapio_hoje')
  .select('*')
  .eq('restaurante_id', RESTAURANTE_ID)
  .single()
```

### Passo 2 — Integrar WhatsApp (Z-API)

Ao confirmar pedido no site:
```js
async function confirmarPedido(pedido) {
  // 1. Salva no banco (aparece no PDV automaticamente)
  await supabase.from('pedidos').insert(pedido)

  // 2. Envia mensagem via Z-API
  await fetch('https://api.z-api.io/instances/INSTANCIA/token/TOKEN/send-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: pedido.telefone,
      message: `✅ Pedido recebido!\n\n${formatarMensagem(pedido)}\n\nEntrega em ~40min 🛵`
    })
  })
}
```

---

## Parte 3 — Bot WhatsApp com IA (n8n)

### Arquitetura

```
WhatsApp → Evolution API → Webhook → n8n → Supabase
                                       ↓
                              OpenAI (Whisper + GPT)
                                       ↓
                              WhatsApp ← resposta
```

### Passo 1 — Servidor VPS

Contrate um VPS na Hostinger ou Hetzner (~R$50/mês):
- Ubuntu 22.04
- 2GB RAM (mínimo)
- Instale Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

### Passo 2 — Instalar Evolution API (WhatsApp)

```bash
# docker-compose.yml
version: '3'
services:
  evolution:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://seudominio.com.br
      - AUTHENTICATION_API_KEY=sua-chave-secreta
```

```bash
docker-compose up -d
```

Acesse o painel, escaneie o QR Code com o WhatsApp do restaurante.

### Passo 3 — Instalar n8n

```bash
# Adicionar ao docker-compose.yml
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=seudominio.com.br
      - WEBHOOK_URL=https://seudominio.com.br/
```

### Passo 4 — Criar o fluxo no n8n

**Fluxo básico (sem IA):**
```
[Webhook: mensagem recebida]
    ↓
[Switch: tipo de mensagem]
    ├─ "cardápio" → [Buscar no Supabase] → [Responder com cardápio]
    ├─ "quero pedir" → [Iniciar sessão de pedido]
    └─ outro → [Responder: "Olá! Quer ver o cardápio?"]
```

**Fluxo com IA:**
```
[Webhook: mensagem recebida]
    ↓
[Se áudio] → [Whisper API: transcrever para texto]
    ↓
[Claude/GPT: interpretar intenção]
  Prompt: "Você é atendente do restaurante Fogão a Lenha.
           Cardápio de hoje: {cardapio}
           Mensagem do cliente: {mensagem}
           Identifique a intenção e extraia: opção, tamanho, retiradas, extras"
    ↓
[Supabase: inserir pedido] + [WhatsApp: confirmar para cliente]
```

### Passo 5 — Transcrição de áudio (Whisper)

```js
// Nó "Code" no n8n
const audioBuffer = items[0].binary.data
const formData = new FormData()
formData.append('file', audioBuffer, 'audio.ogg')
formData.append('model', 'whisper-1')

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_KEY}` },
  body: formData
})
const { text } = await response.json()
return [{ json: { transcricao: text } }]
```

---

## Parte 4 — Landing Page

### Estrutura de arquivos
```
landing/
  src/
    sections/
      Hero.jsx
      Problema.jsx
      Solucao.jsx
      Funcionalidades.jsx
      ComoFunciona.jsx
      Planos.jsx
      FAQ.jsx
      CTA.jsx
    App.jsx
```

### Stack recomendada
- **Next.js 14** (melhor SEO que Vite puro)
- **Tailwind CSS**
- **Framer Motion** (animações suaves)
- **Vercel** (deploy)

### Dicas de copywriting
- Título: "Gerencie seu restaurante do jeito certo"
- Subtítulo: "Pedidos, caixa, estoque e cardápio em um só lugar. Acessa do PC, tablet ou celular."
- CTA: "Teste grátis por 30 dias — sem cartão"

---

## Resumo de custos mensais (operando com clientes)

| Serviço | Gratuito até | Pago |
|---------|-------------|------|
| Supabase | 50k req/mês | $25/mês |
| Vercel | Projetos ilimitados | $20/mês (Pro) |
| Z-API (WhatsApp) | — | R$97/mês |
| Evolution API | Self-hosted grátis | VPS ~R$50/mês |
| n8n Cloud | 5k execuções | $20/mês |
| OpenAI (Whisper+GPT) | — | ~$0,01 por mensagem |
| Domínio | — | R$40/ano |

**Total estimado com 10-20 restaurantes:** ~R$400/mês de custo, cobrando R$150/restaurante = R$1.500-3.000/mês de receita.

---

*Ebook criado em 14/03/2026 — Gustavo & Claude*

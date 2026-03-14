# Ecossistema Fogão a Lenha da Leninha — Roadmap Completo

> Documento de visão criado em 14/03/2026. Serve como guia para construção de todos os projetos.

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                   ECOSSISTEMA FOGÃO A LENHA                 │
│                                                             │
│  [1] App de Gestão (PDV)  ←──────────────────────────────┐  │
│       ↑ sincroniza pedidos                               │  │
│  [2] Site de Pedidos Online ──→ [3] Bot WhatsApp ────────┘  │
│       ↑ recebe pedidos                ↑ IA escuta áudio      │
│  [4] Landing Page (vitrine para vender o sistema)           │
└─────────────────────────────────────────────────────────────┘
```

---

## PROJETO 1 — App de Gestão PDV (atual)
**Status:** ✅ Em construção (browser) → migrar para online

### Fases
- [x] v1: módulos base (pedidos, clientes, cardápio)
- [x] v2: financeiro, estoque, fornecedores, funcionários, dashboard
- [ ] v3: migração para online (Supabase + Vercel + login por restaurante)
- [ ] v4: PWA instalável (manifesto + service worker)
- [ ] v5: impressão em impressora térmica (ESC/POS via QZ Tray)

### Stack definitiva
- React 19 + Vite + Tailwind v4
- Supabase (banco PostgreSQL + autenticação)
- Vercel (hospedagem + deploys automáticos)
- Domínio próprio (ex: gestao.fogaodaleninha.com.br)

---

## PROJETO 2 — Site de Pedidos Online
**Status:** 🔜 Próximo projeto beta

### O que é
Site público onde os clientes do restaurante montam o pedido e finalizam.
Ao finalizar, o pedido é enviado automaticamente para o WhatsApp do cliente
E simultaneamente entra no App de Gestão (Projeto 1).

### Diferença do Scooby-Doo Lanches
| Scooby-Doo | Fogão a Lenha |
|------------|---------------|
| Link do WhatsApp gerado manualmente | Mensagem enviada automaticamente via API |
| Sem integração com gestão | Pedido entra direto no PDV |
| Sem bot de resposta | Bot responde, confirma e acompanha |

### Funcionalidades
- Cardápio do dia puxado do App de Gestão (em tempo real)
- Montagem do pedido (opção, tamanho, acompanhamentos, extras)
- Cálculo automático do valor
- Seleção de forma de pagamento
- Endereço de entrega
- Ao confirmar → API WhatsApp envia mensagem para o cliente
- Ao confirmar → pedido entra automaticamente no App de Gestão

### Stack
- React + Tailwind (frontend público)
- Supabase (banco compartilhado com o PDV)
- Evolution API ou Z-API (WhatsApp API)
- Vercel (hospedagem)

---

## PROJETO 3 — Bot WhatsApp com IA
**Status:** 🔜 Fase beta planejada

### O que o bot faz (fluxo completo)

```
Cliente manda mensagem no WhatsApp
        ↓
   IA escuta (se for áudio) / lê (se for texto)
        ↓
   Bot apresenta cardápio do dia (cardápio real do PDV)
        ↓
   Cliente escolhe opção, tamanho, extras (conversa natural)
        ↓
   Bot confirma pedido e valor
        ↓
   Pedido entra automaticamente no App de Gestão
        ↓
   Bot envia confirmação + previsão de entrega
        ↓
   Quando entregue: bot notifica o cliente
```

### Tecnologias
- **n8n** (orquestrador de fluxo — self-hosted ou cloud)
- **Evolution API** (WhatsApp não-oficial, self-hosted) ou **Z-API** (oficial pago)
- **OpenAI Whisper** (transcrição de áudio → texto)
- **Claude API ou GPT-4** (interpretação do pedido, respostas naturais)
- **Supabase** (consulta cardápio + insere pedido)
- **VPS** (servidor para rodar n8n + Evolution API) — ~R$50/mês (Hostinger ou Hetzner)

### Fluxo n8n
```
Trigger: Webhook (mensagem WhatsApp recebida)
  → Nó: verificar se é áudio ou texto
  → Se áudio: Whisper transcreve
  → Nó: Claude/GPT interpreta intenção
  → Se "quero cardápio": busca no Supabase e responde
  → Se "quero pedir": inicia fluxo de pedido
  → Ao finalizar: insere pedido no Supabase (aparece no PDV)
  → Envia confirmação para o cliente
```

---

## PROJETO 4 — Landing Page (vitrine do sistema para vender)
**Status:** 🔜 Criar junto com a migração online

### Objetivo
Página de vendas do sistema PDV para outros restaurantes.
Apresenta o produto, mostra funcionalidades, planos e permite cadastro.

### Seções
1. Hero — nome + tagline + CTA "Teste grátis 30 dias"
2. Problema — "Ainda usa caderno ou planilha?"
3. Solução — demonstração visual do app (screenshots/vídeo)
4. Funcionalidades — cards com ícones
5. Como funciona — passo a passo em 3 etapas
6. Planos e preços
7. Depoimentos (quando tiver clientes)
8. FAQ
9. CTA final + formulário de contato

### Stack
- React + Tailwind (ou Next.js para SEO)
- Vercel
- Domínio: sistemafogao.com.br ou similar

---

## Modelo de Negócio (sugestão)

| Plano | Preço/mês | O que inclui |
|-------|-----------|--------------|
| Starter | R$ 79 | PDV + até 200 pedidos/mês |
| Pro | R$ 149 | PDV + pedidos online + site |
| Premium | R$ 299 | Tudo + Bot WhatsApp + IA |

---

## Ordem de execução recomendada

```
[AGORA]     Finalizar App de Gestão (logos, PWA, migração online)
[MÊS 1-2]  Landing Page + sistema de cadastro/login por restaurante
[MÊS 2-3]  Site de Pedidos Online + integração WhatsApp simples
[MÊS 3-5]  Bot WhatsApp com n8n + IA (áudio + texto)
[MÊS 5+]   Escalar, onboarding de novos clientes
```

---

*Documento mantido por Gustavo — atualizar conforme o projeto avança.*

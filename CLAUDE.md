# Fogão a Lenha da Leninha — Sistema PDV

## Stack
- React 19 + Vite 8
- Tailwind CSS v4 (PostCSS plugin — NÃO usa `tailwind.config.js`, usa `@import "tailwindcss"` no CSS)
- React Router DOM v7
- Lucide React (ícones)
- Dados persistidos em `localStorage`

## Como rodar
```bash
cd C:/Users/Gustavo/fogao-leninha
npm run dev
```
Abre em http://localhost:5173

## Estrutura
```
src/
  context/AppContext.jsx       → Estado global + localStorage
  components/Layout.jsx        → Sidebar com 8 itens de navegação
  utils/endereco.js            → formatarEndereco(), ENDERECO_VAZIO
  pages/
    Pedidos.jsx                → Novo pedido, lista, status, motoboy
    Clientes.jsx               → CRUD clientes, mensalistas, débitos
    Cardapio.jsx               → Cardápio do dia + refrigerantes/combos
    Financeiro.jsx             → Fluxo de caixa, despesas, receitas
    Estoque.jsx                → Inventário com alertas de estoque baixo
    Fornecedores.jsx           → CRUD fornecedores + controle de pagamento
    Funcionarios.jsx           → Funcionários, salários, motoboys
    Dashboard.jsx              → Relatórios, KPIs, fechamento mensal
```

## Stores no AppContext
- `clientes` — CRUD + autoRegistrarCliente (auto-cadastra no primeiro pedido)
- `pedidos` — CRUD + statusPagamento (pago/pendente/mensalista) + motoboy + quitarPedido
- `cardapio` — refrigerantes e combos
- `cardapioHoje` — `{ carnes: ['','',''], precoP, precoG, opcoes: [{id, nome, acompanhamentos, disponivel}] }`
- `despesas` — CRUD + pagarDespesa
- `estoque` — CRUD + atualizarQuantidade (+/-)
- `fornecedores` — CRUD + pagarFornecedor
- `funcionarios` — CRUD
- `motoboys` — lista de strings (adicionarMotoboy, removerMotoboy)

## Funcionalidades v2.0
- [x] Pedidos com chips de acompanhamentos (todos selecionados, clicar remove)
- [x] Embalagem adicional (+/- R$1 cada)
- [x] Horário de entrega programada + campo motoboy
- [x] Status de pagamento: Pago / Pendente / Mensalista
- [x] Auto-cadastro de clientes no primeiro pedido
- [x] Financeiro: despesas por categoria, fluxo do dia, receitas vs despesas
- [x] Estoque: quantidade com alertas de estoque mínimo
- [x] Fornecedores: CRUD + dia de pagamento + status pago/não pago
- [x] Funcionários: lista + salários + seção motoboys
- [x] Dashboard: KPIs do dia, período selecionável, fechamento mensal

## Rotas públicas (sem login)
- `/` → PedidoOnline.jsx — cardápio do dia para clientes pedirem online
- `/equipe` → PedidoEquipe.jsx — coleta rápida de pedidos pela equipe via celular (protegida por PIN)

## Tabela configuracoes (Supabase)
```sql
-- Rodar no SQL Editor do Supabase se ainda não existir:
CREATE TABLE IF NOT EXISTS configuracoes (
  id int PRIMARY KEY DEFAULT 1,
  "pixChave" text DEFAULT '',
  "pixNome" text DEFAULT 'Fogão a Lenha da Leninha',
  "pixBanco" text DEFAULT '',
  "restauranteWhatsapp" text DEFAULT '',
  "lojaAberta" boolean DEFAULT true,
  "equipePIN" text DEFAULT '1234',
  "atualizadoEm" timestamptz DEFAULT now()
);
INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
```
- Config salva pelo painel admin via `salvarConfig()` no AppContext
- Lida diretamente pelas páginas públicas sem AppContext

## PedidoOnline.jsx — Página pública de pedidos
- Desktop: 2 colunas (catálogo + carrinho/checkout lado a lado)
- Mobile: steps (cardápio → carrinho → checkout → confirmado)
- Lê cardapio_hoje, clientes e configuracoes direto do Supabase
- Detecção automática de mensalista pelo nome
- Pagamento: Pix (mostra chave + botão copiar) ou Dinheiro
- Confirmação com número sequencial do pedido

## PedidoEquipe.jsx — Área da equipe (/equipe)
- Protegida por PIN (padrão: 1234, configurável em configuracoes.equipePIN)
- Fluxo: nome do cliente → opção+tamanho → remover acompanhamentos → revisar → confirmar
- Autocomplete de clientes cadastrados, detecção de mensalista
- Inserção direta no Supabase com origem: 'equipe'

## Pendente
- Envio automático de relatório diário por email (ghenriique30@gmail.com)

## Regra de Sincronização Git (OBRIGATÓRIO)

**Ao iniciar sessão:** o hook `SessionStart` roda `git pull` automaticamente — aguarde antes de editar.
**Ao encerrar sessão:** sempre commitar e pushar tudo antes de fechar.

```bash
git add src/...     # adicionar arquivos alterados
git commit -m "..."
git push origin main
```

Nunca deixar trabalho sem commitar. O GitHub é a fonte da verdade entre contas e dispositivos.

## GitHub
Repositório: https://github.com/Gustavoheen/fogao-leninha

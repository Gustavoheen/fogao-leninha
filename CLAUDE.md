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

## Próximas melhorias planejadas
- Impressão de comanda
- Conversão para Electron (.exe)
- Relatórios por período com exportação

## GitHub
Repositório: https://github.com/Gustavoheen/fogao-leninha

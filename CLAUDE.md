# Fogão a Lenha da Leninha — Sistema PDV

## Stack
- React 19 + Vite 8
- Tailwind CSS v4 (PostCSS)
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
  context/AppContext.jsx   → Estado global + localStorage (clientes, pedidos, cardápio)
  components/Layout.jsx    → Sidebar com navegação
  pages/
    Clientes.jsx           → Cadastro e busca de clientes
    Pedidos.jsx            → Novo pedido, lista, status
    Cardapio.jsx           → Cardápio do dia com toggle de disponibilidade
    Pagamentos.jsx         → Resumo financeiro do dia, fiados
```

## Funcionalidades v1
- [x] Cadastro de clientes (nome, telefone, endereço, observações)
- [x] Pedidos com itens do cardápio, forma de pagamento, status
- [x] Cardápio do dia por categoria com toggle de disponibilidade
- [x] Resumo de pagamentos por forma + fiados pendentes
- [x] Dados salvos localmente no navegador (localStorage)

## Próximas melhorias planejadas
- Relatórios por período
- Impressão de comanda
- Controle de estoque
- Conversão para Electron (.exe)

## GitHub
Repositório: https://github.com/Gustavoheen/fogao-leninha

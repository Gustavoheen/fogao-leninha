-- ============================================================
-- Fogão a Lenha da Leninha — Schema Supabase
-- Cole este SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id bigint PRIMARY KEY,
  nome text,
  telefone text,
  rua text,
  bairro text,
  numero text,
  referencia text,
  observacoes text,
  tipo text DEFAULT 'normal',
  "criadoEm" timestamptz DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id bigint PRIMARY KEY,
  "clienteId" bigint,
  "clienteNome" text,
  "clienteTelefone" text,
  rua text,
  bairro text,
  numero text,
  referencia text,
  itens jsonb,
  total numeric,
  pagamento text,
  status text DEFAULT 'aberto',
  "statusPagamento" text DEFAULT 'pago',
  "horarioEntrega" text,
  "embalagensAdicionais" int DEFAULT 0,
  motoboy text,
  observacoes text,
  "comandaImpressaEm" timestamptz,
  "quitadoEm" timestamptz,
  "criadoEm" timestamptz DEFAULT now()
);

-- Cardápio (refrigerantes, combos etc.)
CREATE TABLE IF NOT EXISTS cardapio (
  id bigint PRIMARY KEY,
  nome text,
  categoria text,
  subtipo text,
  preco numeric,
  descricao text,
  disponivel boolean DEFAULT true,
  "criadoEm" timestamptz DEFAULT now()
);

-- Cardápio do Dia (documento único, id=1)
CREATE TABLE IF NOT EXISTS cardapio_hoje (
  id int PRIMARY KEY DEFAULT 1,
  carnes jsonb DEFAULT '["","",""]',
  "precoP" numeric DEFAULT 0,
  "precoG" numeric DEFAULT 0,
  opcoes jsonb DEFAULT '[]',
  "atualizadoEm" timestamptz DEFAULT now()
);

-- Despesas
CREATE TABLE IF NOT EXISTS despesas (
  id bigint PRIMARY KEY,
  categoria text,
  descricao text,
  valor numeric,
  data date,
  pago boolean DEFAULT false,
  "pagadoEm" timestamptz,
  "criadoEm" timestamptz DEFAULT now()
);

-- Estoque
CREATE TABLE IF NOT EXISTS estoque (
  id bigint PRIMARY KEY,
  nome text,
  categoria text,
  quantidade numeric DEFAULT 0,
  unidade text DEFAULT 'un',
  "qtdMinima" numeric DEFAULT 0,
  preco numeric DEFAULT 0,
  "fornecedorId" bigint,
  "criadoEm" timestamptz DEFAULT now()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id bigint PRIMARY KEY,
  nome text,
  contato text,
  telefone text,
  produtos text,
  "valorMensal" numeric DEFAULT 0,
  "diaPagamento" int DEFAULT 1,
  pago boolean DEFAULT false,
  "pagadoEm" timestamptz,
  observacoes text,
  "criadoEm" timestamptz DEFAULT now()
);

-- Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id bigint PRIMARY KEY,
  nome text,
  cargo text,
  salario numeric DEFAULT 0,
  "dataAdmissao" text,
  ativo boolean DEFAULT true,
  observacoes text,
  "criadoEm" timestamptz DEFAULT now()
);

-- Motoboys
CREATE TABLE IF NOT EXISTS motoboys (
  nome text PRIMARY KEY
);

-- Configurações do restaurante (documento único, id=1)
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

-- ============================================================
-- Registros padrão
-- ============================================================
INSERT INTO cardapio_hoje (id, carnes, opcoes)
VALUES (
  1,
  '["","",""]',
  '[{"id":1,"nome":"Opção 1","acompanhamentos":[],"disponivel":true},{"id":2,"nome":"Opção 2","acompanhamentos":[],"disponivel":true}]'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

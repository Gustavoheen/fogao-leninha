-- ============================================================
-- RLS SECURITY — Fogão a Lenha da Leninha
-- Banco: nfjyjnvmorwhikhczplp
-- Rodar no Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Habilitar RLS em todas as tabelas ────────────────────────
ALTER TABLE configuracoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio_hoje  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoboys       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELAS SEMI-PÚBLICAS
-- Anon pode ler (páginas públicas: cardápio, checkout)
-- Authenticated (admin logado) tem acesso total
-- ============================================================

-- configuracoes — lida pelas páginas públicas (lojaAberta, pix, etc.)
CREATE POLICY "anon_read"  ON configuracoes FOR SELECT TO anon        USING (true);
CREATE POLICY "auth_all"   ON configuracoes FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- cardapio — lido pela página pública de pedidos
CREATE POLICY "anon_read"  ON cardapio FOR SELECT TO anon        USING (true);
CREATE POLICY "auth_all"   ON cardapio FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- cardapio_hoje — lido pela página pública de pedidos
CREATE POLICY "anon_read"  ON cardapio_hoje FOR SELECT TO anon        USING (true);
CREATE POLICY "auth_all"   ON cardapio_hoje FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- clientes — anon lê (autocomplete) e insere (auto-cadastro no primeiro pedido)
CREATE POLICY "anon_read"   ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON clientes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_all"    ON clientes FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- pedidos — anon lê (geração de número sequencial) e insere (fazer pedido)
CREATE POLICY "anon_read"   ON pedidos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert" ON pedidos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_all"    ON pedidos FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TABELAS PRIVADAS
-- Apenas admin autenticado — anon BLOQUEADO
-- ============================================================

CREATE POLICY "auth_all" ON despesas      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON estoque       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON fornecedores  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON funcionarios  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON motoboys      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- CRIAR USUÁRIO ADMIN (rodar UMA vez)
-- Alternativa: Supabase Dashboard > Authentication > Users > Add user
-- Email: admin@fogaoleninha.com.br
-- Senha inicial: fogao2024 (trocar após primeiro login)
-- ============================================================
-- SELECT auth.uid(); -- verificar se já existe sessão ativa

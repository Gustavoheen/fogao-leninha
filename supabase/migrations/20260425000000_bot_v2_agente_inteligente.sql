-- ════════════════════════════════════════════════════════════════
-- Bot v2 — Agente inteligente (function calling)
-- Adições para clientes, modificações de cardápio, horário e PIX
-- ════════════════════════════════════════════════════════════════

-- ── Clientes: complemento + forma de pagamento padrão ──────────
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pagamento_padrao text;
-- tipo já existe; valores aceitos pelo bot: 'avulso' | 'mensalista' | 'fiado'
COMMENT ON COLUMN clientes.tipo IS 'avulso | mensalista | fiado';
COMMENT ON COLUMN clientes.pagamento_padrao IS 'pix | dinheiro | cartao | mensalidade | fiado';

-- ── Tabela de modificações do cardápio (sem arroz, extra carne…) ──
CREATE TABLE IF NOT EXISTS cardapio_modificacoes (
  id bigserial PRIMARY KEY,
  nome text NOT NULL,
  preco_extra numeric DEFAULT 0,
  tipo text DEFAULT 'remover',   -- 'remover' | 'adicionar'
  ativa boolean DEFAULT true,
  "criadoEm" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modif_ativa ON cardapio_modificacoes (ativa);

-- Modificação inicial conhecida
INSERT INTO cardapio_modificacoes (nome, preco_extra, tipo)
SELECT 'sem arroz', 5, 'remover'
WHERE NOT EXISTS (SELECT 1 FROM cardapio_modificacoes WHERE LOWER(nome) = 'sem arroz');

-- ── Cardápio do dia: URL do flyer/banner do dia ────────────────
ALTER TABLE cardapio_hoje ADD COLUMN IF NOT EXISTS imagem_flyer text;

-- ── Configurações: horário de funcionamento + PIX ──────────────
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS horario_funcionamento jsonb
  DEFAULT '{"seg":["07:00","14:00"],"ter":["07:00","14:00"],"qua":["07:00","14:00"],"qui":["07:00","14:00"],"sex":["07:00","14:00"],"sab":null,"dom":null}';

-- Forçar horário e PIX corretos (cliente confirmou)
UPDATE configuracoes
SET horario_funcionamento = '{"seg":["07:00","14:00"],"ter":["07:00","14:00"],"qua":["07:00","14:00"],"qui":["07:00","14:00"],"sex":["07:00","14:00"],"sab":null,"dom":null}'::jsonb,
    "pixChave"            = 'fogaoalenhadaleninha@gmail.com',
    "pixNome"             = COALESCE(NULLIF("pixNome",''), 'Fogão a Lenha da Leninha')
WHERE id = 1;

-- ── RLS service_role nas novas tabelas ─────────────────────────
ALTER TABLE cardapio_modificacoes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cardapio_modificacoes' AND policyname = 'service_role_modif'
  ) THEN
    CREATE POLICY service_role_modif ON cardapio_modificacoes
      FOR ALL USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cardapio_modificacoes' AND policyname = 'public_read_modif'
  ) THEN
    CREATE POLICY public_read_modif ON cardapio_modificacoes
      FOR SELECT USING (true);
  END IF;
END $$;

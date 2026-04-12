-- Sessões do bot WhatsApp (Fogão a Lenha)
CREATE TABLE IF NOT EXISTS fogao_whatsapp_sessions (
  telefone TEXT PRIMARY KEY,
  estado TEXT NOT NULL DEFAULT 'novo',
  humano_ativo BOOLEAN NOT NULL DEFAULT FALSE,
  bot_msg_ids TEXT[] DEFAULT '{}',
  nome_contato TEXT,
  ultimo_pedido_id BIGINT,
  ia_historico JSONB DEFAULT '[]',
  ia_pedido JSONB,
  dados_cliente JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fogao_wpp_sessions_updated
  ON fogao_whatsapp_sessions (updated_at DESC);

ALTER TABLE fogao_whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fogao_whatsapp_sessions' AND policyname = 'service_role_sessions') THEN
    CREATE POLICY service_role_sessions ON fogao_whatsapp_sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Alertas/reclamações
CREATE TABLE IF NOT EXISTS fogao_alertas (
  id SERIAL PRIMARY KEY,
  telefone TEXT NOT NULL,
  nome_contato TEXT,
  tipo TEXT NOT NULL,
  mensagem TEXT,
  pedido_id BIGINT,
  status TEXT NOT NULL DEFAULT 'aberto',
  respondido_por TEXT,
  resposta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fogao_alertas_status ON fogao_alertas (status, created_at DESC);

ALTER TABLE fogao_alertas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fogao_alertas' AND policyname = 'service_role_alertas') THEN
    CREATE POLICY service_role_alertas ON fogao_alertas FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Coluna bot_ativo e bot_dicas nas configurações
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS bot_ativo TEXT DEFAULT 'auto';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS bot_dicas TEXT DEFAULT '';

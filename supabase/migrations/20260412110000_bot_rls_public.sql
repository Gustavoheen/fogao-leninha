-- Permitir acesso público (anon) às tabelas do bot (mesmo padrão das outras tabelas do fogão)
DROP POLICY IF EXISTS service_role_sessions ON fogao_whatsapp_sessions;
CREATE POLICY "full_access_sessions" ON fogao_whatsapp_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_alertas ON fogao_alertas;
CREATE POLICY "full_access_alertas" ON fogao_alertas FOR ALL USING (true) WITH CHECK (true);

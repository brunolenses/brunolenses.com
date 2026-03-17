-- Libera a leitura para a role anon (necessário para o Dashboard Admin)
CREATE POLICY "Enable read for all" ON "public"."social_leads" FOR SELECT USING (true);

-- Libera a inserção para a role anon (necessário para o formulário no site)
CREATE POLICY "Enable insert for all" ON "public"."social_leads" FOR INSERT WITH CHECK (true);

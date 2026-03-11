-- Script SQL para criar a máquina de inteligência do Lenses Lab (Fase 7)

-- 1. Criar a Tabela principal para armazenar os diagnósticos DXM
CREATE TABLE public.dxm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_info JSONB NOT NULL, -- Vai salvar os dados do bloco 1: name, email, phone, instagram, product
    diagnosis_data JSONB NOT NULL, -- Vai salvar um objeto gigante com todas as 60 respostas de posicionamento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configurar Segurança (RLS - Row Level Security)
-- Precisamos permitir que visitantes anônimos apenas INSIRAM dados (o formulário submetendo),
-- mas não possam LER ou VER os dados dos outros (privacidade comercial).
ALTER TABLE public.dxm_leads ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa anônima no site pode Inserir um diagnóstico
CREATE POLICY "Allow anonymous insert to dxm_leads" 
    ON public.dxm_leads 
    FOR INSERT 
    WITH CHECK (true);

-- Política: Somente o Admin (sua conta logada) pode ver ou consultar os leads capturados
CREATE POLICY "Allow authenticated full access to dxm_leads" 
    ON public.dxm_leads 
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- ==========================================
-- PRONTO! Rode esse script no SQL Editor do Supabase.

-- =========================================================================================
-- ONLYLENSES - SUPABASE DATABASE CONFIGURATION
-- =========================================================================================
-- Copie todo este código e cole no "SQL Editor" do seu painel do Supabase, depois clique em RUN.

-- 1. Criar a Tabela de Álbuns (Ensaios)
CREATE TABLE public.albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    model_name TEXT,
    cover_image_url TEXT,
    access_type TEXT CHECK (access_type IN ('free', 'password', 'stripe')) DEFAULT 'free',
    price NUMERIC(10, 2) DEFAULT 0.00,
    password_hash TEXT, -- Usado apenas se access_type = 'password'
    stripe_link TEXT,   -- Novo campo para você colar o Checkout Link do Stripe
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Criar a Tabela de Mídias (Fotos e Vídeos de cada Álbum)
CREATE TABLE public.media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Configurar Segurança (RLS - Row Level Security)
-- Por enquanto, vamos permitir leitura pública para facilitar o Front-end, 
-- já que o bloqueio real será no HTML/JS lendo o 'access_type' do banco.
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Allow public read access to media" ON public.media FOR SELECT USING (true);

-- Política para você (Admin autenticado) poder Inserir/Atualizar os dados
CREATE POLICY "Allow authenticated full access to albums" ON public.albums FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to media" ON public.media FOR ALL USING (auth.role() = 'authenticated');

-- Update dxm_leads to store AI analysis
ALTER TABLE dxm_leads ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE dxm_leads ADD COLUMN IF NOT EXISTS status_analise TEXT DEFAULT 'pendente';

-- Create social_leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_info JSONB,
    answers JSONB,
    ai_analysis JSONB,
    status_analise TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_leads ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Allow public insert to social_leads" ON social_leads FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read social_leads" ON social_leads FOR SELECT TO authenticated USING (true);

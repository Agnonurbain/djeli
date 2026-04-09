-- 004_curriculum_content.sql
-- Contenu pédagogique avec embeddings vectoriels pour RAG

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE curriculum_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level student_level NOT NULL,
  subject VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  source VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON curriculum_content
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

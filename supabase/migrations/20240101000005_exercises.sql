-- 005_exercises.sql
-- Exercices liés au contenu pédagogique

CREATE TYPE exercise_type AS ENUM ('qcm','redaction','calcul','photo');

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES curriculum_content(id),
  type exercise_type NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 002_mastery_tree.sql
-- Table de progression / arbre de maîtrise

CREATE TABLE mastery_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  mastery_level mastery DEFAULT 'novice',
  exercises_completed INTEGER DEFAULT 0,
  last_score REAL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject, topic)
);

-- RLS
ALTER TABLE mastery_tree ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_own_mastery" ON mastery_tree
  FOR ALL USING (auth.uid() = student_id);

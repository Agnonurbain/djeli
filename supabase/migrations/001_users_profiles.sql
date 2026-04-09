-- 001_users_profiles.sql
-- Création des types et tables utilisateurs

CREATE TYPE user_role AS ENUM ('student', 'parent', 'teacher');
CREATE TYPE student_level AS ENUM (
  '6eme','5eme','4eme','3eme',
  '2nde','1ere','tle',
  'l1','l2','l3','m1','m2'
);
CREATE TYPE mastery AS ENUM ('novice','apprenti','confirme','expert','maitre');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  role user_role NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  level student_level NOT NULL,
  school VARCHAR(200),
  city VARCHAR(100),
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_own_profile" ON student_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 009_parent_links_rls.sql
-- RLS sur parent_links + policies croisées pour que les parents voient
-- le profil et la progression des enfants liés (lien confirmé uniquement).
--
-- Flow d'appairage (pour contexte) :
--   1. L'élève demande un code : insertion d'une ligne parent_links
--      (student_id = lui, parent_id = NULL, pairing_code = "ABC123", confirmed = false).
--   2. Le parent saisit le code dans son dashboard : il appelle le RPC
--      claim_parent_link(code) qui, SECURITY DEFINER, contourne RLS le temps
--      de vérifier le code puis attache parent_id = auth.uid() et passe
--      confirmed = true.
--
-- Pourquoi un RPC SECURITY DEFINER :
--   RLS bloquerait un parent qui tente de SELECT un parent_links où
--   parent_id IS NULL — il n'est pas "propriétaire" de la ligne.
--   Le RPC fait la recherche avec les droits du créateur de la fonction,
--   puis applique l'UPDATE en associant le bon parent.
--
-- Pourquoi le code expire :
--   On ajoute pairing_expires_at. Un code est valable 15 min. Au-delà,
--   le RPC refuse et l'élève doit en regénérer un.

-- ============================================================================
-- 1. Ajout du TTL du code d'appairage
-- ============================================================================

ALTER TABLE parent_links
  ADD COLUMN IF NOT EXISTS pairing_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS parent_links_pairing_code_idx
  ON parent_links (pairing_code)
  WHERE confirmed = false AND parent_id IS NULL;

-- ============================================================================
-- 2. RLS de base sur parent_links
-- ============================================================================

ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

-- Un élève voit ses propres liens (confirmés ou en attente)
CREATE POLICY "student_reads_own_links" ON parent_links
  FOR SELECT USING (auth.uid() = student_id);

-- Un parent voit ses propres liens confirmés
CREATE POLICY "parent_reads_own_links" ON parent_links
  FOR SELECT USING (auth.uid() = parent_id);

-- Un élève crée ses propres demandes (parent_id NULL au départ)
CREATE POLICY "student_inserts_own_link" ON parent_links
  FOR INSERT WITH CHECK (auth.uid() = student_id AND parent_id IS NULL);

-- Un élève peut modifier/supprimer ses demandes (ex. regénérer un code)
CREATE POLICY "student_updates_own_link" ON parent_links
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "student_or_parent_deletes_link" ON parent_links
  FOR DELETE USING (auth.uid() = student_id OR auth.uid() = parent_id);

-- ============================================================================
-- 3. Policies croisées : parents → profils et progression des enfants
-- ============================================================================

CREATE POLICY "parents_read_children_profile" ON student_profiles
  FOR SELECT USING (
    user_id IN (
      SELECT student_id FROM parent_links
      WHERE parent_id = auth.uid() AND confirmed = true
    )
  );

CREATE POLICY "parents_read_children_mastery" ON mastery_tree
  FOR SELECT USING (
    student_id IN (
      SELECT pl.student_id FROM parent_links pl
      WHERE pl.parent_id = auth.uid() AND pl.confirmed = true
    )
  );

-- ============================================================================
-- 4. RPC claim_parent_link : confirmation atomique d'un code d'appairage
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_parent_link(p_code VARCHAR)
RETURNS TABLE (
  student_id UUID,
  student_display_name VARCHAR,
  student_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_link_id UUID;
  v_student_id UUID;
  v_role TEXT;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = 'P0001';
  END IF;

  -- Seuls les users de rôle "parent" peuvent réclamer un code
  SELECT u.role::TEXT INTO v_role FROM users u WHERE u.id = v_parent_id;
  IF v_role IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'Seuls les parents peuvent utiliser un code d''appairage'
      USING ERRCODE = 'P0001';
  END IF;

  -- Chercher un lien en attente correspondant au code (non expiré)
  SELECT pl.id, pl.student_id
    INTO v_link_id, v_student_id
  FROM parent_links pl
  WHERE pl.pairing_code = p_code
    AND pl.confirmed = false
    AND pl.parent_id IS NULL
    AND (pl.pairing_expires_at IS NULL OR pl.pairing_expires_at > now())
  LIMIT 1;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Code invalide ou expiré' USING ERRCODE = 'P0001';
  END IF;

  -- Attacher le parent et confirmer le lien
  UPDATE parent_links
  SET parent_id = v_parent_id,
      confirmed = true,
      pairing_code = NULL,
      pairing_expires_at = NULL
  WHERE id = v_link_id;

  -- Retourner les infos de l'enfant pour feedback immédiat au parent
  RETURN QUERY
  SELECT sp.user_id, sp.display_name, sp.level::TEXT
  FROM student_profiles sp
  WHERE sp.user_id = v_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_parent_link(VARCHAR) TO authenticated;

-- 007_match_curriculum_content.sql
-- Fonction RPC de recherche vectorielle pgvector pour le pipeline RAG.
--
-- Utilisée par src/lib/ai/rag.ts (searchContent) pour récupérer les contenus
-- pédagogiques les plus proches sémantiquement de la question de l'élève.
--
-- Filtrage combiné : similarité cosinus + niveau scolaire + matière.
-- Seuil de similarité minimal bas (0.0) pour éviter de renvoyer 0 résultat
-- quand la base est peu peuplée au démarrage — le LLM sait tolérer du contexte
-- faiblement pertinent, mais ne sait pas gérer l'absence totale de contexte.

CREATE OR REPLACE FUNCTION match_curriculum_content(
  query_embedding TEXT,
  match_count INTEGER DEFAULT 5,
  filter_level TEXT DEFAULT NULL,
  filter_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(200),
  content TEXT,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.title,
    cc.content,
    (1 - (cc.embedding <=> query_embedding::vector))::REAL AS similarity
  FROM curriculum_content cc
  WHERE
    cc.embedding IS NOT NULL
    AND (filter_level IS NULL OR cc.level::text = filter_level)
    AND (filter_subject IS NULL OR cc.subject = filter_subject)
  ORDER BY cc.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;

-- Autoriser l'exécution pour les clients authentifiés Supabase
GRANT EXECUTE ON FUNCTION match_curriculum_content(TEXT, INTEGER, TEXT, TEXT)
  TO authenticated, anon, service_role;

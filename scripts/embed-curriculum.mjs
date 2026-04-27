// scripts/embed-curriculum.mjs
//
// Génère les embeddings vectoriels pour les contenus de curriculum_content.
//
// Usage :
//   1. S'assurer que .env.local contient :
//        - GOOGLE_AI_API_KEY=...
//        - NEXT_PUBLIC_SUPABASE_URL=...
//        - SUPABASE_SERVICE_ROLE_KEY=...   (le secret côté serveur, pas l'anon)
//   2. Lancer :
//        npm run db:embed
//
// Le script lit toutes les lignes de curriculum_content où embedding IS NULL,
// génère un embedding via Gemini text-embedding-004 (768 dimensions, compatible
// avec la colonne VECTOR(768)), puis update la ligne. Les lignes déjà
// embeddées sont ignorées — le script est donc rejouable sans risque.
//
// Pourquoi un .mjs et pas un .ts ? Pour éviter d'ajouter tsx/ts-node comme
// dépendance dev. Ce script ne fait pas partie du runtime Next.js, c'est un
// outil ponctuel d'admin.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Modèle Gemini d'embedding (768 dimensions)
const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Charge .env.local manuellement pour éviter d'introduire dotenv comme dépendance.
 * Format : KEY=VALUE par ligne, # pour les commentaires.
 */
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Retirer les guillemets éventuels
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Ne pas écraser une variable déjà présente dans l'environnement
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[embed] Impossible de lire .env.local :', error.message);
    }
  }
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) {
    console.error(
      '[embed] GOOGLE_AI_API_KEY manquante dans .env.local — impossible de générer les embeddings.'
    );
    process.exit(1);
  }
  if (!supabaseUrl || !serviceKey) {
    console.error(
      '[embed] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante.\n' +
        '        La service_role_key est dans Dashboard > Project Settings > API.'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Charger les contenus sans embedding
  const { data: rows, error } = await supabase
    .from('curriculum_content')
    .select('id, level, subject, topic, title, content')
    .is('embedding', null);

  if (error) {
    console.error('[embed] Erreur de lecture :', error.message);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('[embed] Aucun contenu à embedder. Tout est à jour.');
    return;
  }

  console.log(`[embed] ${rows.length} contenu(s) à traiter...`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    // Concatène titre + contenu pour un embedding plus riche
    const textToEmbed = `${row.title}\n\n${row.content}`;

    try {
      const result = await model.embedContent(textToEmbed);
      const vector = result.embedding.values;

      if (!Array.isArray(vector) || vector.length !== 768) {
        throw new Error(
          `Embedding inattendu (longueur ${vector?.length ?? 'inconnue'}, attendu 768)`
        );
      }

      // pgvector accepte une string formatée "[v1,v2,...,v768]"
      const pgVector = `[${vector.join(',')}]`;

      const { error: updateError } = await supabase
        .from('curriculum_content')
        .update({ embedding: pgVector })
        .eq('id', row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      success += 1;
      console.log(
        `[embed] ✓ ${row.level}/${row.subject}/${row.topic} — ${row.title}`
      );
    } catch (err) {
      failed += 1;
      console.error(
        `[embed] ✗ ${row.level}/${row.subject}/${row.topic} — ${row.title} :`,
        err.message
      );
    }
  }

  console.log(`\n[embed] Terminé : ${success} succès, ${failed} échec(s).`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[embed] Erreur fatale :', err);
  process.exit(1);
});

#!/bin/bash
# scripts/setup-supabase.sh
# Initialisation de la base de données Supabase pour Djeli
#
# Usage :
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   bash scripts/setup-supabase.sh
#
# Prérequis : npm installé, supabase CLI disponible via npx

set -euo pipefail

PROJECT_REF="wdeejquazxbpdjxgkrth"

echo "=== Djeli — Setup Supabase ==="
echo ""

# Vérifier le token
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERREUR : SUPABASE_ACCESS_TOKEN non défini."
  echo "  export SUPABASE_ACCESS_TOKEN=\"sbp_...\""
  exit 1
fi

# 1. Lier le projet local au projet remote
echo "[1/4] Liaison au projet Supabase ($PROJECT_REF)..."
npx supabase link --project-ref "$PROJECT_REF"
echo "  ✓ Projet lié"

# 2. Appliquer les migrations
echo ""
echo "[2/4] Application des migrations SQL..."
npx supabase db push
echo "  ✓ 6 migrations appliquées (users, mastery_tree, chat_sessions, curriculum_content, exercises, parent_links)"

# 3. Générer les types TypeScript
echo ""
echo "[3/4] Génération des types TypeScript..."
npx supabase gen types typescript --project-id "$PROJECT_REF" > src/types/database.ts
echo "  ✓ Types générés dans src/types/database.ts"

# 4. Vérification
echo ""
echo "[4/4] Vérification du type-check..."
npx tsc --noEmit
echo "  ✓ TypeScript OK"

echo ""
echo "=== Setup terminé ! ==="
echo ""
echo "Prochaines étapes :"
echo "  1. Configurer Twilio Verify dans le dashboard Supabase"
echo "     (Authentication → Providers → Phone → Twilio Verify)"
echo "  2. Ajouter TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID"
echo "     dans le dashboard Supabase (Project Settings → Edge Functions → Secrets)"
echo "  3. npm run dev"

# CLAUDE.md — Instructions pour Claude Code

## Projet

**Djeli** (Prof Chibi) — Tuteur IA pour élèves ivoiriens (6ème → université).
PWA Next.js avec agent IA (Gemini + LangGraph), Supabase, paiement Mobile Money.

## Architecture

Lire `ARCHITECTURE.md` pour l'architecture complète : stack, schéma DB, structure dossiers, flux agent IA, paiement, offline, sécurité.

## Stack

- **Framework** : Next.js 14 (App Router, TypeScript strict)
- **Styling** : Tailwind CSS
- **DB** : Supabase (PostgreSQL + pgvector + Auth + Realtime)
- **LLM** : Gemini 1.5 Pro via @google/generative-ai
- **Orchestration IA** : LangGraph (TypeScript)
- **Formules maths** : KaTeX (pas MathJax)
- **Animations** : Rive
- **Paiement** : CinetPay (Mobile Money CI)
- **SMS/WhatsApp** : Twilio
- **Tests** : Vitest + React Testing Library
- **Lint** : ESLint + Prettier

## Commandes

```bash
npm run dev          # Serveur développement (port 3000)
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test         # Vitest
npm run db:generate  # Génère les types Supabase (npx supabase gen types typescript)
npm run db:migrate   # Applique les migrations Supabase
```

## Conventions de code

### Générales
- TypeScript strict partout, pas de `any`
- Noms de variables/fonctions en **anglais**
- Commentaires explicatifs en **français** pour la logique métier
- Chaque fichier commence par un commentaire de chemin : `// src/components/...`
- Validation de TOUTES les entrées API avec **Zod**
- Pas de secrets en dur — tout dans `.env.local`

### React / Next.js
- Composants fonctionnels uniquement (pas de class components)
- `"use client"` uniquement quand nécessaire (hooks, events, browser APIs)
- Server Components par défaut
- Imports absolus avec `@/` prefix (ex: `@/components/ui/Button`)
- Un composant par fichier, nom du fichier = nom du composant (PascalCase)

### Supabase
- Toujours utiliser le client serveur (`createServerClient`) dans les Route Handlers
- Toujours utiliser le client navigateur (`createBrowserClient`) dans les composants client
- RLS activé sur TOUTES les tables contenant des données utilisateur
- Types générés automatiquement via `supabase gen types typescript`

### API Routes
- Toutes dans `src/app/api/`
- Toujours valider le body avec Zod avant traitement
- Toujours vérifier l'authentification en premier
- Retourner des erreurs structurées : `{ error: string, code: string }`
- Rate limiting sur les routes IA

### Agent IA
- Les system prompts sont dans `src/lib/ai/prompts/`
- Le prompt est construit dynamiquement selon : niveau élève, matière, état émotionnel, progression
- Pipeline RAG : embed question → recherche pgvector → inject contexte → Gemini streaming
- Les réponses IA doivent être en streaming (SSE) vers le client

## Structure des dossiers

```
src/
├── app/          # Pages et API routes (Next.js App Router)
├── components/   # Composants React réutilisables
├── lib/          # Logique métier, clients, utils
├── hooks/        # Custom React hooks
└── types/        # Types TypeScript
supabase/
├── migrations/   # SQL migrations numérotées
└── seed.sql      # Données initiales
```

## Contexte culturel important

L'application cible la **Côte d'Ivoire**. Garder en tête :
- Auth par **OTP SMS** (pas email — tout le monde n'a pas d'email)
- Paiement **Mobile Money** (Orange Money, MTN MoMo, Wave) — pas Stripe/PayPal
- Réseau **3G instable** — optimiser chaque kilooctet, mode offline obligatoire
- Téléphones **Android entrée de gamme** — performances critiques
- Monnaie : **FCFA (XOF)**
- Langue : **Français** pour l'interface et le contenu pédagogique
- Le ton de l'IA s'adapte au niveau : ludique pour le collège, exigeant pour le lycée, expert pour l'université
- Analogies locales dans les cours (marché de Treichville, quartiers d'Abidjan, prix en FCFA)

## Ce qu'il ne faut PAS faire

- Ne pas utiliser `localStorage` pour les tokens (httpOnly cookies uniquement)
- Ne pas persister les photos de brouillons sur disque (traitement en mémoire)
- Ne pas exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- Ne pas utiliser MathJax (trop lourd) — KaTeX uniquement
- Ne pas créer de class components React
- Ne pas hardcoder des prix ou des limites — tout dans des constantes centralisées

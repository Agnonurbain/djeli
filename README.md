# 🎓 Djeli — Prof Chibi

> Le mentor intelligent ivoirien. Tuteur IA du collège à l'université.

**Djeli** est une PWA éducative qui accompagne les élèves ivoiriens dans leur apprentissage grâce à un agent IA adaptatif, un avatar Chibi animé, et une pédagogie ancrée dans le contexte local (analogies de marché de Treichville, gbaka, manguier d'Abidjan).

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Supabase (Postgres + pgvector + RLS) · Gemini 2.5 · LangGraph · Rive · CinetPay (Mobile Money) · Twilio (SMS / WhatsApp) · Vitest

## Fonctionnalités implémentées

- **Auth OTP SMS** via Supabase Auth + Twilio Verify
- **Tableau Noir** — chat streaming avec Prof Chibi (Gemini + RAG pgvector)
- **Arbre de Maîtrise** — XP, niveaux quadratiques, paliers `novice → maître`
- **Dashboard Parent** — appairage par code 6 caractères, rapports hebdo, encouragements WhatsApp
- **Abonnement** — Mobile Money via CinetPay (Orange / MTN / Wave)
- **PWA offline** — Service Worker, IndexedDB, Background Sync
- **Mode test** automatique pour Twilio et CinetPay si les credentials manquent

## Démarrage rapide

```bash
cp .env.example .env.local
# Remplir les variables d'environnement (au minimum Supabase pour démarrer)
npm install
npm run dev
```

## Commandes

```bash
npm run dev          # Serveur développement (port 3000)
npm run build        # Build production
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run test         # Vitest
npm run db:generate  # Génère les types Supabase depuis le schéma distant
npm run db:migrate   # Applique les migrations Supabase
npm run db:embed     # Génère les embeddings pgvector des contenus pédagogiques
npm run format       # Prettier
```

## Architecture des dossiers

```
src/
├── app/
│   ├── (auth)/        # Login, OTP, onboarding
│   ├── (parent)/      # Dashboard parent
│   ├── (student)/     # Tableau, arbre, abonnement, sac-à-dos
│   └── api/           # Route Handlers (chat, progress, payment, parent…)
├── components/        # UI réutilisable (chibi, tableau, progression, audio…)
├── hooks/             # useChat, useProgress, useSubscription, useOffline
├── lib/
│   ├── ai/            # Agent LangGraph + RAG + prompts
│   ├── payment/       # CinetPay
│   ├── notifications/ # Twilio WhatsApp / SMS
│   ├── offline/       # Service Worker registration + IndexedDB + sync queue
│   ├── progress/      # Calculs XP / paliers de maîtrise
│   └── supabase/      # Clients server / browser / middleware
└── types/             # Types TypeScript (database généré, chat, payment…)

supabase/migrations/   # Migrations SQL numérotées (001 → 009)
public/                # Assets statiques + sw.js + manifest + icons
```

## Variables d'environnement

Voir `.env.example`. **Seul Supabase est obligatoire pour démarrer** — les autres
services (Gemini, Twilio, CinetPay) ont des modes simulés qui s'activent
automatiquement si les credentials sont absents.

## Tests

```bash
npm run test
```

Suites actuelles : `src/lib/progress/xp.test.ts` (19 tests sur le calcul XP / niveaux / maîtrise).

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Architecture technique détaillée
- [`CLAUDE.md`](./CLAUDE.md) — Instructions pour Claude Code

## Licence

Propriétaire — Tous droits réservés.

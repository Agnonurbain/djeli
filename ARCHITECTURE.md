# Djeli — Architecture Technique

> **Djeli** (nom de code) / **Prof Chibi** (nom produit)
> Tuteur IA pour les élèves ivoiriens — du collège à l'université.

---

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                      │
│  Next.js 14 (App Router) + Tailwind + Rive          │
│  Service Worker + IndexedDB (offline)                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│               API LAYER (Next.js Route Handlers)     │
│  /api/auth    /api/chat    /api/progress             │
│  /api/payment /api/parent  /api/content              │
└──┬─────────┬─────────┬─────────┬────────────────────┘
   │         │         │         │
   ▼         ▼         ▼         ▼
Supabase   Gemini   WhatsApp   Payment
(DB+Auth)  (LLM)    (Twilio)   (CinetPay)
+pgvector  +Lang-
           Graph
```

**Type d'application :** PWA (Progressive Web App) — pas d'app native.
**Pourquoi :** Pas de Play Store nécessaire, installation via navigateur, léger en data, un seul codebase. La cible utilise des Android d'entrée de gamme sur réseau 3G instable.

---

## 2. Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | SSR/SSG, API routes intégrées, déploiement Vercel |
| Styling | Tailwind CSS | Purge auto du CSS inutilisé, léger |
| Animations avatar | Rive | Vectoriel, state machines, fichiers minuscules vs Lottie |
| Formules maths | KaTeX | 10x plus rapide que MathJax sur mobile bas de gamme |
| Base de données | Supabase (PostgreSQL + pgvector) | Auth intégrée, RLS, Realtime, Vector Store natif |
| LLM | Gemini 1.5 Pro (Google AI) | Multimodal (texte+image), long contexte, coût raisonnable |
| Orchestration IA | LangGraph (TypeScript) | Agent à états, routing intelligent, mémoire |
| SMS OTP | Twilio Verify | Fiabilité CI, fallback WhatsApp |
| WhatsApp parents | Twilio WhatsApp Business API | Canal dominant en CI |
| Paiement | CinetPay | Orange Money, MTN MoMo, Wave — seul agrégateur couvrant bien la CI |
| Hébergement | Vercel + Cloudflare CDN | Edge functions, cache Afrique de l'Ouest |
| Monitoring | Sentry + Vercel Analytics | Erreurs + Core Web Vitals |
| CI/CD | GitHub Actions | Tests → Preview → Production |

---

## 3. Structure du projet

```
djeli/
├── CLAUDE.md                    # Instructions pour Claude Code
├── ARCHITECTURE.md              # Ce fichier
├── .env.local                   # Variables d'environnement (jamais commit)
├── .env.example                 # Template des variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker (généré)
│   └── rive/
│       └── chibi.riv            # Fichier animation avatar
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (providers, fonts)
│   │   ├── page.tsx             # Landing / redirect
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Login OTP SMS
│   │   │   └── onboarding/
│   │   │       └── page.tsx     # Choix niveau + diagnostic initial
│   │   ├── (student)/
│   │   │   ├── layout.tsx       # Layout étudiant (nav, avatar persistant)
│   │   │   ├── tableau/
│   │   │   │   └── page.tsx     # Tableau Noir Dynamique (cœur de l'app)
│   │   │   ├── sac-a-dos/
│   │   │   │   └── page.tsx     # Inventaire : cours, exercices, récompenses
│   │   │   ├── arbre/
│   │   │   │   └── page.tsx     # Arbre de Maîtrise (progression)
│   │   │   └── grin/
│   │   │       └── [sessionId]/
│   │   │           └── page.tsx # Mode collaboratif
│   │   ├── (parent)/
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx     # Vue parent : rapports, boost
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── send-otp/route.ts
│   │       │   ├── verify-otp/route.ts
│   │       │   └── pair-parent/route.ts
│   │       ├── chat/
│   │       │   └── route.ts     # Streaming LLM (POST)
│   │       ├── photo/
│   │       │   └── analyze/route.ts  # Upload brouillon → Gemini Vision
│   │       ├── progress/
│   │       │   └── route.ts     # CRUD progression / mastery tree
│   │       ├── content/
│   │       │   └── search/route.ts   # Recherche sémantique RAG
│   │       ├── payment/
│   │       │   ├── checkout/route.ts
│   │       │   └── webhook/route.ts  # Callback CinetPay
│   │       └── parent/
│   │           ├── report/route.ts   # Génération rapport hebdo
│   │           └── boost/route.ts    # Envoi encouragement
│   ├── components/
│   │   ├── chibi/
│   │   │   ├── ChibiAvatar.tsx       # Wrapper Rive <canvas>
│   │   │   └── chibi-emotions.ts     # State machine : happy, thinking, sad, excited
│   │   ├── tableau/
│   │   │   ├── TableauNoir.tsx       # Container principal zone cours
│   │   │   ├── LatexRenderer.tsx     # Wrapper KaTeX
│   │   │   ├── CodeBlock.tsx         # Coloration syntaxique
│   │   │   └── MessageBubble.tsx     # Bulle de conversation IA
│   │   ├── exercices/
│   │   │   ├── QCM.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── CalculInput.tsx
│   │   │   └── PhotoCapture.tsx      # Composant caméra pour brouillons
│   │   ├── progression/
│   │   │   ├── MasteryTree.tsx       # Visualisation arbre SVG/Canvas
│   │   │   ├── XPBar.tsx
│   │   │   └── StreakCounter.tsx
│   │   ├── audio/
│   │   │   └── BulleConcentration.tsx # Ambiance sonore Lo-Fi
│   │   └── ui/                       # Primitives : Button, Input, Modal, Toast
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient
│   │   │   ├── server.ts             # createServerClient (pour Route Handlers)
│   │   │   └── middleware.ts          # Refresh session middleware
│   │   ├── ai/
│   │   │   ├── agent.ts              # LangGraph agent definition
│   │   │   ├── nodes/
│   │   │   │   ├── router.ts         # Intent detection node
│   │   │   │   ├── teach.ts          # Noeud enseignement socratique
│   │   │   │   ├── evaluate.ts       # Noeud évaluation / correction
│   │   │   │   └── motivate.ts       # Noeud détection découragement
│   │   │   ├── prompts/
│   │   │   │   ├── system.ts         # System prompt dynamique par niveau
│   │   │   │   ├── college.ts        # Ton 6ème-3ème (ludique, analogies locales)
│   │   │   │   ├── lycee.ts          # Ton 2nde-Tle (structuré, exigeant)
│   │   │   │   └── universite.ts     # Ton L1-M2 (académique, expert)
│   │   │   └── rag.ts               # Pipeline : embed → pgvector search → inject
│   │   ├── offline/
│   │   │   ├── register-sw.ts        # Enregistrement Service Worker
│   │   │   ├── db.ts                 # IndexedDB via idb (cours, exercices, queue)
│   │   │   └── sync-queue.ts         # Background sync : pousse les réponses offline
│   │   ├── payment/
│   │   │   ├── cinetpay.ts           # SDK CinetPay : init, verify, webhook handler
│   │   │   └── plans.ts             # Définition des plans (free, premium)
│   │   └── utils/
│   │       ├── format.ts
│   │       └── validators.ts         # Schémas Zod pour toutes les entrées
│   ├── hooks/
│   │   ├── useChat.ts                # Streaming SSE du LLM vers le tableau
│   │   ├── useProgress.ts            # Lecture/écriture progression élève
│   │   ├── useOffline.ts             # Navigator.onLine + fallback IndexedDB
│   │   ├── useAudio.ts              # Contrôle ambiance sonore
│   │   └── useSubscription.ts        # Statut premium de l'utilisateur
│   ├── types/
│   │   ├── database.ts              # Types générés par Supabase CLI (supabase gen types)
│   │   ├── chat.ts                  # Message, ChatSession, AgentState
│   │   ├── curriculum.ts            # Subject, Topic, Exercise, Level
│   │   └── payment.ts              # Plan, Transaction, WebhookPayload
│   └── middleware.ts                # Auth middleware (redirect si non connecté)
└── supabase/
    ├── config.toml
    ├── migrations/
    │   ├── 001_users_profiles.sql
    │   ├── 002_mastery_tree.sql
    │   ├── 003_chat_sessions.sql
    │   ├── 004_curriculum_content.sql
    │   ├── 005_exercises.sql
    │   └── 006_parent_links.sql
    └── seed.sql                     # Données initiales (matières, niveaux)
```

---

## 4. Schéma base de données

```sql
-- === UTILISATEURS ===

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

-- === PROGRESSION ===

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

-- === CONVERSATIONS IA ===

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50),
  topic VARCHAR(100),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === CONTENU PÉDAGOGIQUE ===

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

-- === EXERCICES ===

CREATE TYPE exercise_type AS ENUM ('qcm','redaction','calcul','photo');

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES curriculum_content(id),
  type exercise_type NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === LIEN PARENT-ÉLÈVE ===

CREATE TABLE parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pairing_code VARCHAR(6),
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- === PAIEMENTS ===

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  cinetpay_transaction_id VARCHAR(100),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === RLS (Row Level Security) ===

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_own_profile" ON student_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "students_own_mastery" ON mastery_tree
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "students_own_chats" ON chat_sessions
  FOR ALL USING (auth.uid() = student_id);
```

---

## 5. Agent IA — LangGraph

### Architecture de l'agent

```
                    ┌──────────────┐
          Input ──▶ │   ROUTER     │
                    │ (Classifie   │
                    │  l'intention)│
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ TEACH    │    │ EVALUATE │    │ MOTIVATE │
    │ Cours    │    │ Quiz,    │    │ Détecte  │
    │ socrat.  │    │ correct° │    │ stress / │
    │ + RAG    │    │ + score  │    │ ennui    │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         └───────────────┼───────────────┘
                         ▼
                  ┌──────────────┐
                  │   MEMORY     │
                  │ Sauvegarde   │
                  │ progression  │
                  └──────────────┘
```

### Pipeline RAG

```
Question élève
  1. Embedding via Gemini Embedding API
  2. Recherche pgvector → top 5 contenus du programme ivoirien
  3. Injection dans le system prompt + historique conversation (10 derniers messages)
  4. Gemini 1.5 Pro génère la réponse en streaming
  5. Réponse affichée sur le Tableau Noir avec rendu LaTeX/code
```

### System prompt dynamique

Le system prompt est construit dynamiquement selon :
- Le **niveau** de l'élève (6ème = ludique, Tle = exigeant, M2 = expert)
- La **matière** en cours
- L'**état émotionnel** détecté (découragement → plus d'encouragements)
- La **progression** dans le topic (novice → plus d'exemples, expert → plus de challenges)

---

## 6. Mode Offline

### Stratégie 3 niveaux

1. **Cache statique** (Service Worker) : shell app, CSS, JS, assets Rive — précachés à l'installation.
2. **Cache dynamique** (IndexedDB via `idb`) : 20 derniers cours, exercices en cours, progression locale.
3. **Sync queue** (Background Sync API) : réponses aux exercices stockées offline, envoyées au retour du réseau.

### Pré-chargement intelligent

Quand le Wi-Fi est détecté, on pré-charge en arrière-plan les 2-3 prochains chapitres du parcours de l'élève.

---

## 7. Paiement Mobile Money (CinetPay)

### Flux

```
1. Élève clique "Passer Premium"
2. Choix méthode : Orange Money / MTN MoMo / Wave
3. Redirect vers CinetPay → USSD sur le téléphone
4. Webhook POST /api/payment/webhook
5. Vérification signature + mise à jour is_premium en DB
6. Renouvellement mensuel automatique
```

### Plans

| Plan | Prix | Limites |
|---|---|---|
| Gratuit | 0 FCFA | 3 interactions IA/jour, exercices limités, pas de Mode Grin |
| Premium | 1 500 FCFA/mois | Illimité, Mode Grin, annales complètes, rapports parents |

---

## 8. Notifications WhatsApp (Parents)

```
Cron hebdomadaire (dimanche 18h) via Supabase Edge Function :
  → Collecte progression semaine
  → L'élève valide les réussites à partager (anti-triche)
  → Gemini génère un résumé en langage naturel
  → Envoi via Twilio WhatsApp Business API
  → Parent peut répondre "BOOST" → encouragement affiché sur le Tableau Noir
```

---

## 9. Sécurité

- **Auth** : JWT httpOnly cookie + refresh token rotation (pas de localStorage)
- **Rate limiting** : 3 req/min IA (gratuit), 20 req/min (premium) — protège le coût Gemini
- **Validation** : Zod sur TOUTES les entrées API, côté serveur
- **RLS** : isolation stricte par utilisateur en base
- **Chiffrement** : TLS en transit, encryption at-rest Supabase
- **Photos brouillon** : traitées en mémoire, jamais persistées sur disque
- **Mineurs** : consentement parental obligatoire < 16 ans, pas de données exposées publiquement
- **Mode Grin** : modération IA temps réel des messages, flag + blocage automatique

---

## 10. Infrastructure

```
Vercel (Next.js SSR + Edge Functions)
  └── Cloudflare CDN (cache statique, nœuds Afrique)

Supabase Cloud
  ├── PostgreSQL + pgvector
  ├── Auth (OTP via Twilio)
  ├── Realtime (WebSockets pour Mode Grin)
  ├── Edge Functions (crons rapports parents)
  └── Storage (assets pédagogiques si nécessaire)

Google Cloud
  ├── Gemini 1.5 Pro API
  └── Gemini Embedding API

Twilio
  ├── Verify (SMS OTP)
  └── WhatsApp Business API
```

### CI/CD

```
Push sur branche → GitHub Actions :
  1. Lint (ESLint + Prettier)
  2. Type check (tsc --noEmit)
  3. Tests unitaires (Vitest)
  4. Preview deploy (Vercel)
Merge sur main → Production auto (Vercel)
```

---

## 11. Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI (Gemini)
GOOGLE_AI_API_KEY=

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=

# CinetPay
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 12. Phasage MVP

### Phase 1 — MVP (cible : élèves 3ème + Tle)
- Auth OTP SMS
- Tableau Noir + streaming Gemini
- Analyse Photo brouillon
- Arbre de Maîtrise basique
- Cycle : Évaluation → Cours → Exercice → Validation
- Avatar Rive (3 émotions)
- PWA installable
- Paiement CinetPay

### Phase 2 — Engagement
- Mode Offline complet
- Bulle de Concentration
- Rapports WhatsApp parents + Boost
- Onboarding + diagnostic initial
- Tous niveaux secondaire

### Phase 3 — Social & Scale
- Mode Grin (collaboratif temps réel)
- Dashboard Enseignant
- Vocal STT/TTS
- Modules universitaires
- Pipeline mise à jour contenu annuel

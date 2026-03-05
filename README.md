# AI Travel Planner ✈️

A production-ready SaaS travel planning application powered by GPT-4o. Users describe their trip and an AI generates a complete day-by-day itinerary with maps, budget tracking, weather forecasts, and real-time collaboration.

## Live Demo

Deploy to Vercel in minutes — see deployment guide below.

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Home dashboard
│   │   ├── trips/           # Trip list, new trip, trip editor
│   │   ├── settings/        # User settings
│   │   └── billing/         # Stripe subscription management
│   ├── (admin)/             # Admin panel (role-gated)
│   ├── api/                 # API Route Handlers
│   │   ├── auth/            # NextAuth + registration
│   │   ├── trips/           # CRUD + activities, collaborators, sharing
│   │   ├── ai/              # Streaming itinerary generation
│   │   ├── weather/         # Open-Meteo forecast fetching
│   │   └── stripe/          # Checkout + webhook
│   ├── share/[token]/       # Public SEO-optimized trip pages
│   └── layout.tsx           # Root layout with theme provider
├── components/
│   ├── ui/                  # Reusable shadcn/ui primitives
│   ├── layout/              # Sidebar, top nav
│   ├── dashboard/           # Stats cards, recent trips, usage meter
│   ├── itinerary/           # Trip editor, DnD builder, day columns, activity cards
│   ├── map/                 # Mapbox GL interactive map
│   ├── budget/              # Budget breakdown panel
│   ├── weather/             # Weather strip and detail view
│   ├── collaboration/       # Invite panel, collaborator list
│   ├── trips/               # New trip wizard
│   └── shared/              # Theme provider, auth forms
├── lib/
│   ├── ai/                  # OpenAI client, prompt templates, generation logic
│   ├── db/                  # Prisma singleton
│   ├── stripe/              # Stripe client + plan definitions
│   ├── email/               # Resend transactional emails
│   ├── logger/              # Pino structured logging
│   ├── auth.ts              # NextAuth v5 config
│   └── validations/         # Zod schemas (auth, trips, AI responses)
├── stores/                  # Zustand client state (trip, ui)
├── types/                   # TypeScript augmentations
└── middleware.ts            # Auth protection for all routes
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Google, GitHub, credentials) |
| AI | OpenAI GPT-4o with streaming + Zod validation |
| Maps | Mapbox GL JS |
| Drag & Drop | dnd-kit |
| State | Zustand + immer |
| Payments | Stripe (subscriptions) |
| Email | Resend |
| Logging | Pino |
| PWA | Web App Manifest + service worker |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Random 32+ char string
- `OPENAI_API_KEY` — From platform.openai.com
- `NEXT_PUBLIC_MAPBOX_TOKEN` — From mapbox.com

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

The Prisma schema defines 14 models:

```
User → Account, Session (NextAuth)
     → Subscription (Stripe plan)
     → Trip[] (owned trips)
     → TripCollaborator[] (shared trips)

Trip → TripDay[] → Activity[]
     → Budget → BudgetItem[]
     → TripCollaborator[]
     → Comment[]
     → TripVersion[] (history)
     → WeatherForecast[]

Organization → OrganizationMember[]
             → Trip[]

AiUsageLog   (per-user AI call tracking)
FeatureFlag  (admin feature toggles)
```

Run `npm run db:studio` to explore the database visually.

---

## Key Features

### AI Itinerary Generation
- Streaming SSE responses for real-time UI feedback
- GPT-4o with structured JSON output
- Zod schema validation of AI response
- Auto-retry with exponential backoff (3 attempts)
- Single-day regeneration without touching other days
- Persisted to database after stream completes

### Drag-and-Drop Builder (dnd-kit)
- Reorder activities within a day
- Move activities between days (cross-container DnD)
- Optimistic UI updates via Zustand
- Auto-save to database with debouncing
- Drag overlay with card preview

### Interactive Map (Mapbox)
- All activities rendered as numbered pins
- Color-coded by category
- Click pin to select activity
- Fly-to animation when selecting from sidebar
- Bounds auto-fit when itinerary loads

### Collaboration System
- Email invitations via Resend
- Role-based: Owner / Editor / Viewer
- Invite tokens with 7-day expiry
- Real-time access control on all API routes

### Stripe Subscriptions
- Free tier: 3 trips, 10 AI calls/month
- Pro tier: Unlimited everything
- 14-day free trial
- Webhook-driven subscription state
- Usage meter in dashboard

---

## Deployment: Vercel + PostgreSQL

### 1. Database (Neon, Supabase, or Railway)

Recommended: **Neon** (serverless PostgreSQL, free tier)

```bash
# After creating database, run:
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 2. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect via GitHub in the Vercel dashboard.

### 3. Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add all variables from `.env.example`.

### 4. Stripe Webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to https://yourapp.vercel.app/api/stripe/webhook

# Set the webhook secret in Vercel env:
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. OAuth Apps

**Google:** console.cloud.google.com → OAuth 2.0 credentials
- Authorized redirect URI: `https://yourapp.vercel.app/api/auth/callback/google`

**GitHub:** github.com → Settings → Developer Settings → OAuth Apps
- Callback URL: `https://yourapp.vercel.app/api/auth/callback/github`

---

## Scaling Considerations

| Concern | Solution |
|---------|----------|
| Database connections | Use PgBouncer (Neon built-in) or connection pooling |
| AI rate limits | Per-user rate limiting with Upstash Redis |
| Map tile costs | Mapbox usage monitoring + caching |
| Image storage | Vercel Blob or Cloudflare R2 |
| Real-time collab | Upgrade to Pusher / Ably / Liveblocks |
| Search | Add pgvector for semantic trip search |
| Analytics | PostHog or Plausible |
| CDN | Vercel Edge Network (automatic) |
| Monitoring | Sentry for error tracking |

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check only
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema changes (dev)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

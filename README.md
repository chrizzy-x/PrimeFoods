# Prime Foods & Prime Kitchen

> AI-assisted food ordering platform with a React Native mobile app for customers and a React web dashboard for restaurant owners.

---

## Repository structure

```
primefoods/
├── apps/
│   ├── prime-foods-mobile/   # Expo React Native (TypeScript, Expo Router)
│   └── prime-kitchen-web/    # React 18 + Vite + TypeScript
├── packages/
│   └── types/                # Shared TypeScript types
├── supabase/
│   ├── config.toml           # Local Supabase configuration
│   ├── migrations/           # SQL migrations (schema + RLS)
│   └── functions/            # Deno Edge Functions
└── docs/
    └── setup.md              # Detailed setup guide
```

## Quick start

See [docs/setup.md](docs/setup.md) for the full developer setup guide.

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Supabase CLI | ≥ 1.200 |
| Expo CLI | ≥ 8 |

### Install dependencies

```bash
corepack enable
pnpm install
```

### Configure environment

```bash
# Web dashboard
cp apps/prime-kitchen-web/.env.example apps/prime-kitchen-web/.env

# Mobile app
cp apps/prime-foods-mobile/.env.example apps/prime-foods-mobile/.env
```

Fill in your Supabase project URL and anon key in both `.env` files.

### Start local Supabase

```bash
supabase start
supabase db push   # apply migrations
```

### Start the apps

```bash
# Web dashboard
cd apps/prime-kitchen-web && pnpm dev

# Mobile app
cd apps/prime-foods-mobile && pnpm start
```

## Technology choices

| Area | Technology |
|------|-----------|
| Mobile | Expo 51, React Native 0.74, Expo Router v3 |
| Web | React 18, Vite 5, React Router v6 |
| Backend | Supabase (Postgres + Auth + Realtime + Edge Functions) |
| Language | TypeScript (strict mode) |
| Package manager | pnpm workspaces |

## Contributing

1. Follow the code style enforced by ESLint and Prettier (`pnpm format`).
2. All production code must pass `pnpm typecheck` and `pnpm lint`.
3. No `console.log` in production paths — use structured logging.
4. Migrations are append-only; never edit committed migration files.

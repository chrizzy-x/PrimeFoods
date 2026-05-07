# Developer Setup Guide

This guide walks you through setting up the Prime Foods monorepo from scratch for local development.

---

## Prerequisites

Install the following tools before proceeding:

| Tool | Install | Version |
|------|---------|---------|
| Node.js | https://nodejs.org | ≥ 20 LTS |
| pnpm | `npm install -g pnpm` or `corepack enable` | ≥ 9 |
| Supabase CLI | https://supabase.com/docs/guides/cli | ≥ 1.200 |
| Docker Desktop | https://www.docker.com/products/docker-desktop | Latest stable |
| Expo CLI | `npm install -g expo-cli` | ≥ 8 |
| iOS Simulator | Xcode (macOS only) | — |
| Android Emulator | Android Studio | — |

---

## 1. Install dependencies

From the repository root:

```bash
corepack enable           # activates pnpm via Node.js corepack
pnpm install              # installs all workspace packages
```

---

## 2. Supabase local setup

### 2a. Start local Supabase

Docker must be running.

```bash
supabase start
```

This will print a block of local credentials, including:
- **API URL** (e.g. `http://127.0.0.1:54321`)
- **anon key**
- **service_role key**
- **DB URL**

### 2b. Apply migrations

```bash
supabase db push
```

This applies all migrations in `supabase/migrations/` in order:
1. `0001_initial_schema.sql` — tables, enums, triggers
2. `0002_rls_policies.sql` — Row Level Security policies

### 2c. Stop local Supabase

```bash
supabase stop
```

---

## 3. Environment variables

### Prime Kitchen web dashboard

```bash
cp apps/prime-kitchen-web/.env.example apps/prime-kitchen-web/.env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase start output>
```

### Prime Foods mobile app

```bash
cp apps/prime-foods-mobile/.env.example apps/prime-foods-mobile/.env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
```

> **Never commit `.env` files.** They are listed in `.gitignore`.

---

## 4. Running the apps

### Prime Kitchen web dashboard

```bash
cd apps/prime-kitchen-web
pnpm dev
```

Opens at http://localhost:3000

### Prime Foods mobile app

```bash
cd apps/prime-foods-mobile
pnpm start
```

- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with the Expo Go app on a physical device

---

## 5. Supabase Edge Functions (local)

```bash
supabase functions serve
```

This serves all functions in `supabase/functions/` locally.

To invoke a function:

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-order' \
  --header 'Authorization: Bearer <your-user-jwt>' \
  --header 'Content-Type: application/json' \
  --data '{ "restaurant_id": "...", "delivery_method": "pickup", "items": [{ "menu_item_id": "...", "quantity": 1 }] }'
```

---

## 6. Type checking and linting

Run from the repository root:

```bash
pnpm typecheck    # type-check all packages
pnpm lint         # lint all packages
pnpm format       # format all files with Prettier
pnpm format:check # check formatting without writing
```

---

## 7. Production Supabase setup

1. Create a project at https://supabase.com
2. Copy your project URL and anon key from **Project Settings → API**
3. Apply migrations:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
4. Deploy edge functions:
   ```bash
   supabase functions deploy create-order
   supabase functions deploy update-order-status
   supabase functions deploy get-restaurant-menu
   ```
5. Update environment variables in your hosting provider.

---

## 8. Database schema overview

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profiles (linked to `auth.users`) |
| `restaurants` | Kitchen/restaurant entities |
| `menu_categories` | Groupings for menu items |
| `menu_items` | Individual orderable items |
| `orders` | Customer orders |
| `order_items` | Line items within an order |
| `deliveries` | Delivery tracking records |
| `reviews` | Customer reviews |

All tables have Row Level Security enabled. See `supabase/migrations/0002_rls_policies.sql` for full policy details.

---

## 9. Troubleshooting

### `supabase start` fails

- Ensure Docker Desktop is running.
- Run `supabase stop --backup` to clean up any stuck containers, then retry.

### `pnpm install` fails

- Ensure Node.js ≥ 20 is active.
- Delete `node_modules/` directories and retry.

### Expo app cannot connect to Supabase locally

- On a physical device, replace `127.0.0.1` with your machine's local IP address in the mobile app `.env`.
- Ensure your device and machine are on the same network.

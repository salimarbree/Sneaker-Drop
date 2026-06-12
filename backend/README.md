# Sneaker Drop — Backend

Real-time sneaker drop inventory system with atomic reservations, JWT auth, and WebSocket live updates.

## Stack

- **Runtime:** Node.js (TypeScript via tsx)
- **Framework:** Express
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** bcrypt + JWT
- **Validation:** Zod
- **Real-time:** Socket.io
- **Architecture:** Module-based (`modules/<name>/` + `shared/`)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL running on `localhost:5433`

### Install & configure

```bash
cp .env.example .env
# Edit .env with your database URL and JWT_SECRET
npm install
npx prisma db push
npx tsx prisma/seed.ts
```

### Run

```bash
npm run dev        # development with watch mode
npm start          # production
```

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm start` | Start production server |
| `npm run build` | Compile TypeScript |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:setup` | Push schema + seed |
| `npm run db:generate` | Regenerate Prisma client |

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script (5 users, 3 drops)
├── src/
│   ├── index.ts            # App entry point
│   ├── modules/
│   │   ├── drop/           # Drop CRUD + listing with top purchasers
│   │   ├── purchase/       # Purchase creation with reservation validation
│   │   ├── reservation/    # Atomic reservation with 60s expiry
│   │   └── user/           # Register, login, profile update
│   ├── services/
│   │   └── stockRecovery.service.ts  # Polls & recovers expired reservations
│   └── shared/
│       ├── lib/            # Prisma client, errors, logger
│       ├── middlewares/    # validate, asyncHandler, errorHandler, auth
│       ├── socket/         # Socket.io setup
│       └── types/          # Express type augmentation
```

## API

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | — | Create account (returns JWT) |
| POST | `/api/users/login` | — | Sign in (returns JWT) |
| GET | `/api/users` | — | List all users |
| GET | `/api/users/me` | Bearer | Get current user |
| PATCH | `/api/users/me` | Bearer | Update profile |

### Drops

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/drops` | — | List drops with top 3 purchasers |
| GET | `/api/drops/:id` | — | Get single drop |
| POST | `/api/drops` | — | Create a drop |

### Reservations

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | — | Reserve a drop (60s expiry, atomic) |

### Purchases

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/purchases` | — | Complete purchase (validates reservation) |

## WebSocket events

- `stock:updated` — emitted when stock changes
- `purchase:new` — emitted when a purchase occurs
- `drop:created` — emitted when a new drop is created

## Seed data

- **Users:** sneakerhead42, dropsniper, heatseeker, resell_king, collector_jay
- **Password:** `password123` (hashed with bcrypt)
- **Drops:** 3 sneaker drops with varying stock levels

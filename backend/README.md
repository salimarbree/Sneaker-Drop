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
│   ├── schema.prisma       # Database schema (User, Drop, Reservation, Purchase)
│   └── seed.ts             # Seed script (6 users, 3 drops)
├── uploads/                # Uploaded images
├── src/
│   ├── index.ts            # App entry point (Express + Socket.io + routes)
│   ├── modules/
│   │   ├── drop/           # Drop CRUD + paginated listing with top purchasers
│   │   ├── purchase/       # Purchase completion with reservation validation
│   │   ├── reservation/    # Atomic reservation with 60s TTL
│   │   ├── upload/         # Image upload (multer, admin only)
│   │   └── user/           # Register, login, profile update
│   ├── services/
│   │   └── stockRecovery.service.ts  # 5s polling — recovers expired reservations
│   └── shared/
│       ├── lib/            # Prisma client, AppError, zodSafeParse
│       ├── middlewares/    # authenticate, optionalAuth, requireAdmin, asyncWrapper, errorHandler
│       ├── socket/         # Socket.io connection handler
│       └── types/          # Express Request augmentation
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
| GET | `/api/drops` | — | List drops (paginated) with top 3 purchasers |
| GET | `/api/drops/:id` | — | Get single drop |
| POST | `/api/drops` | Admin | Create a drop |
| PUT | `/api/drops/:id` | Admin | Update a drop (recalculates stock) |
| DELETE | `/api/drops/:id` | Admin | Delete a drop |

### Upload

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Admin | Upload image (jpg/png/webp/gif/svg, max 5MB) |

### Reservations

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | — | Reserve a drop (60s expiry, atomic) |

### Purchases

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/purchases` | — | Complete purchase (validates reservation) |

## WebSocket events

| Event | Payload | Trigger |
|---|---|---|
| `stock:updated` | `{ dropId, availableStock, totalStock }` | Reservation, purchase, expiry recovery |
| `purchase:new` | `{ dropId, username, createdAt }` | Successful purchase |
| `drop:created` | Drop object | New drop created |
| `drop:updated` | Drop object | Drop updated |
| `drop:deleted` | `{ id }` | Drop deleted |
| `reservation:expired` | `{ dropId, reservationId }` | Stock recovery service |

## Seed data

- **Users (all passwords: `123456`):**
  - `admin@example.com` — admin role
  - `sneakerhead42@example.com`, `dropsniper@example.com`, `heatseeker@example.com`, `resell_king@example.com`, `collector_jay@example.com`
- **Drops:** Air Jordan 1 (10 stock), Yeezy Boost 350 (5 stock), Nike Dunk Low (15 stock)

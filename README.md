# Sneaker Drop

A full-stack real-time sneaker release inventory management system that simulates high-demand sneaker drops with atomic reservations, live stock updates via WebSocket, and a complete admin panel.

## What I Built

### Backend (`backend/`)
- **Node.js + Express + TypeScript** modular monolith with Prisma ORM on PostgreSQL
- **User auth** — register/login with bcryptjs-hashed passwords, JWT tokens (7-day expiry)
- **Drop management** — CRUD for sneaker drops with pagination, top-3 recent purchasers shown per drop
- **Atomic reservations** — 60-second TTL, Prisma transactions prevent overselling, duplicate active reservations blocked per user per drop
- **Purchase flow** — complete purchase after reservation with atomic state transitions
- **Image upload** — multer-based, supports jpg/png/webp/gif/svg up to 5MB
- **Background stock recovery** — 5-second polling recovers expired reservations and emits WebSocket events
- **Socket.io real-time** — emits `stock:updated`, `purchase:new`, `drop:created/updated/deleted`, `reservation:expired` events
- **Shared middleware** — `authenticate`, `optionalAuth`, `requireAdmin`, async wrapper, centralized error handler, Zod validation utility
- **Deployed on Vercel** (serverless-compatible)

### Frontend (`frontend/`)
- **React 19 + TypeScript + Vite 8 + Tailwind CSS 4**
- **Pages**: Home (drop grid with live stock bars), Login, Register, Profile, Admin (full CRUD table with image upload)
- **DropCard component** — stock bar, top-3 buyers with medals, reserve/purchase button, 60s countdown timer, live WebSocket listeners
- **Auth context** — JWT persistence in localStorage, auto-restore on mount
- **Socket hook** — singleton socket.io-client, exposed on `window.__socket`
- **Centralized API client** — fetch-based with JWT injection
- **Polling fallback** — 5-second interval when WebSocket is unreliable (Vercel serverless)
- **Pagination** on home and admin pages

### Database (PostgreSQL via Prisma)
4 models: **User** (with admin role), **Drop** (with stock tracking), **Reservation** (active/expired/purchased states with TTL), **Purchase**

### Seed Data
- 6 users including admin, all with password `123456`
- 3 sample drops: Air Jordan 1 (10 stock), Yeezy Boost 350 (5 stock), Nike Dunk Low (15 stock)

## How to Run

```bash
# Backend
cd backend
cp .env.example .env   # edit DATABASE_URL + JWT_SECRET
npm install
npm run db:setup       # push schema + seed
npm run dev            # starts on :3001

# Frontend
cd frontend
npm install
npm run dev            # starts on :5173, proxies API to :3001
```

Login as admin: `admin@example.com` / `123456`

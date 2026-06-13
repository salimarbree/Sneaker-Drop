# Sneaker Drop — Frontend

React SPA for the real-time sneaker drop inventory system. Features authentication, live stock updates via WebSocket, and a responsive card-based UI.

## Stack

- **Framework:** React 19 + TypeScript
- **Routing:** react-router-dom
- **Styling:** Tailwind CSS 4
- **Build tool:** Vite
- **Real-time:** Socket.io-client
- **Notifications:** react-hot-toast
- **Auth:** JWT stored in localStorage

## Setup

```bash
npm install
```

## Development

```bash
npm run dev        # Starts Vite dev server on :5173
```

The dev server proxies `/api` and `/socket.io` to `http://localhost:3001` (the backend).

## Build

```bash
npm run build      # Outputs to dist/
```

## Project structure

```
frontend/
├── src/
│   ├── api/               # API client with JWT token injection + image URL helper
│   ├── components/        # DropCard (stock bar, buyers, countdown, reserve/purchase)
│   ├── context/           # AuthContext (login, register, logout, profile)
│   ├── hooks/             # useSocket singleton hook
│   ├── pages/             # HomePage, LoginPage, RegisterPage, ProfilePage, AdminPage
│   ├── App.tsx            # Root layout with header, footer, routes, polling fallback
│   ├── main.tsx           # Entry point (BrowserRouter + AuthProvider + Toaster)
│   ├── types.ts           # TypeScript interfaces + WebSocket event types
│   └── index.css          # Tailwind imports
├── index.html
├── vite.config.js         # Proxy /api and /socket.io to :3001
└── tsconfig.json
```

## Pages

| Route | Page | Auth Required |
|---|---|---|---|
| `/` | Home — drops grid with live stock, reservation & purchase | No |
| `/login` | Sign in with email + password | No |
| `/register` | Create account | No |
| `/profile` | Update username, email, password | Yes |
| `/admin` | Admin panel — table CRUD for drops + image upload | Admin role |

## Usage

1. Start the backend on `:3001`
2. Run `npm run dev` in this directory
3. Open `http://localhost:5173`
4. Sign in with a seeded user (e.g. `admin@example.com` / `123456` for admin, or `sneakerhead42@example.com` / `123456`) or register a new account
5. Browse drops, reserve items (60s expiry), and complete purchases in real time

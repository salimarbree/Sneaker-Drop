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
│   ├── api/               # API client with JWT token injection
│   ├── components/        # DropCard, shared UI components
│   ├── context/           # AuthContext (login, register, logout, profile)
│   ├── hooks/             # useSocket hook
│   ├── pages/             # HomePage, LoginPage, RegisterPage, ProfilePage
│   ├── App.tsx            # Root layout with header + routes
│   ├── main.tsx           # Entry point (BrowserRouter + AuthProvider)
│   ├── types.ts           # TypeScript interfaces
│   └── index.css          # Tailwind imports
├── index.html
├── vite.config.js         # Proxy config for backend at :3001
└── tsconfig.json
```

## Pages

| Route | Page | Auth Required |
|---|---|---|
| `/` | Home — drops grid with live stock, reservation & purchase | No |
| `/login` | Sign in with email + password | No |
| `/register` | Create account | No |
| `/profile` | Update username, email, password | Yes (via header nav) |

## Usage

1. Start the backend on `:3001`
2. Run `npm run dev` in this directory
3. Open `http://localhost:5173`
4. Sign in with a seeded user (e.g. `sneakerhead42@example.com` / `password123`) or register a new account
5. Browse drops, reserve items (60s expiry), and complete purchases in real time

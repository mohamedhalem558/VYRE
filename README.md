# VYRE E-Commerce Platform

> Production-quality full-stack e-commerce platform for **VYRE**, an Egyptian local clothing brand.

---

## 🏛️ System Architecture

The platform follows a layered monorepo architecture:

```
React Frontend (Vite, TypeScript, Tailwind CSS, TanStack Query, Axios)
       ↓ (HTTP / REST API)
Express.js Backend (Node.js, TypeScript, Helmet, CORS, Zod)
       ↓ (ORM / Queries)
Prisma ORM
       ↓ (Connection Pooling & Persistence)
PostgreSQL Database
```

---

## 📁 Repository Structure

```
VYRE/
├── apps/
│   ├── web/                    # React Frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI & brand components
│   │   │   ├── pages/          # Application views & route targets
│   │   │   ├── layouts/        # Page wrappers & navigational shell
│   │   │   ├── hooks/          # React hooks & queries
│   │   │   ├── services/       # API clients (Axios)
│   │   │   ├── context/        # React context providers
│   │   │   ├── types/          # Frontend type definitions
│   │   │   ├── utils/          # Formatting & utility helpers
│   │   │   ├── routes/         # Router configuration
│   │   │   ├── App.tsx         # Main App component
│   │   │   ├── main.tsx        # Entry point
│   │   │   └── index.css       # Tailwind & CSS variables
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── .env.example
│   │
│   └── api/                    # Node.js + Express REST API
│       ├── prisma/
│       │   └── schema.prisma   # Prisma schema & PostgreSQL definitions
│       ├── src/
│       │   ├── controllers/    # Request handlers
│       │   ├── routes/         # Express routers
│       │   ├── services/       # Business logic layer
│       │   ├── middleware/     # Security, logging, error handling
│       │   ├── validators/     # Zod input validation schemas
│       │   ├── utils/          # Logger & response utilities
│       │   ├── config/         # Environment & Prisma client setup
│       │   ├── app.ts          # Express app factory
│       │   └── server.ts       # Server entry point & graceful shutdown
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   └── shared/                 # Shared TypeScript models, types & constants
│       ├── src/
│       │   ├── types/          # API & brand interfaces
│       │   ├── constants/      # Brand & HTTP status codes
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml          # PostgreSQL 16 container definition
├── package.json                # Root monorepo workspace scripts
├── .gitignore
├── .env.example                # Global environment variables template
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: `v20+` or `v24+`
- **npm**: `v10+` or `v11+`
- **Docker**: For running PostgreSQL locally (or an existing PostgreSQL service)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Database Setup

Start the local PostgreSQL container via Docker:

```bash
npm run docker:up
```

_Or use your existing local PostgreSQL service._

Generate Prisma client & sync schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run individually:

- **Backend API**: `npm run dev:api` (Runs on `http://localhost:5000`)
- **Frontend Web**: `npm run dev:web` (Runs on `http://localhost:5173`)

---

## 🌐 Endpoints & Ports

| Service                 | Host & Port                                    | Description            |
| :---------------------- | :--------------------------------------------- | :--------------------- |
| **Web Frontend**        | `http://localhost:5173`                        | React Application      |
| **Backend REST API**    | `http://localhost:5000`                        | Express API Gateway    |
| **Health Endpoint**     | `http://localhost:5000/api/v1/health`          | Basic Health Check     |
| **Detailed Health**     | `http://localhost:5000/api/v1/health/detailed` | Diagnostics + DB check |
| **PostgreSQL Database** | `localhost:5432`                               | Database instance      |

### Health Check Response

`GET /api/v1/health`

```json
{
  "success": true,
  "message": "VYRE API is running"
}
```

---

## 🛠️ Monorepo Scripts

| Command                   | Description                                           |
| :------------------------ | :---------------------------------------------------- |
| `npm run dev`             | Run both web and API in development mode concurrently |
| `npm run dev:web`         | Run Vite frontend development server                  |
| `npm run dev:api`         | Run Express API server with live reload (`tsx watch`) |
| `npm run build`           | Build shared package, API, and Web for production     |
| `npm run typecheck`       | Run TypeScript type checks across all workspaces      |
| `npm run lint`            | Run ESLint checks                                     |
| `npm run format`          | Format files with Prettier                            |
| `npm run format:check`    | Check code formatting                                 |
| `npm run prisma:generate` | Generate Prisma client                                |
| `npm run prisma:migrate`  | Run Prisma database migrations                        |
| `npm run docker:up`       | Start PostgreSQL Docker container                     |
| `npm run docker:down`     | Stop PostgreSQL Docker container                      |

---

## 🔑 Local Development Seed Accounts

These seeded test accounts are configured in `prisma/seed.ts` strictly for local environment development and testing. They are **never** exposed in storefront UI pages.

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vyre.local` | `Password123!` | System administration, users & settings |
| **Inventory Manager** | `inventory@vyre.local` | `Password123!` | Stock & warehouse management |
| **Marketing Manager** | `marketing@vyre.local` | `Password123!` | Coupons & promotional campaigns |
| **Customer** | `customer@vyre.local` | `Password123!` | Storefront checkout, wishlist & orders |

---

## 🇪🇬 About Brand

**VYRE** is an Egyptian streetwear and contemporary clothing brand crafted in Cairo, Egypt.
Currency standard: **EGP** (Egyptian Pound).


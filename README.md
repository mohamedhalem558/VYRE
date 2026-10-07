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

## 🚀 Vercel & Neon PostgreSQL Deployment Guide

VYRE is designed to deploy seamlessly on Vercel across two distinct projects created from this monorepo:
1. **Frontend Project (`vyre-web`)**: React + Vite Single Page Application on Vercel CDN.
2. **Backend API Project (`vyre-api`)**: Express + Prisma REST API on Vercel Serverless Functions.
3. **Database**: Serverless PostgreSQL on [Neon](https://neon.tech).

---

### Step 1: Neon PostgreSQL Database Setup

1. Create a project at [neon.tech](https://neon.tech).
2. Create a database (e.g. `vyre_db` or default `neondb`).
3. Under **Dashboard → Connection Details**, select **Connection string** and check **Pooled connection**.
   Your URL will look like:
   ```
   postgresql://neondb_owner:npg_password@ep-cool-snowflake-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > 💡 **Important:** Always use the pooled connection (`-pooler`) URL for serverless runtimes to avoid PostgreSQL connection limits.

4. Push the Prisma database schema and seed the initial catalog from your local machine:
   ```bash
   # Set the database URL in your terminal
   export DATABASE_URL="postgresql://neondb_owner:npg_password@ep-cool-snowflake-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Push schema to Neon
   npm run prisma:push

   # Seed catalog and test accounts (optional)
   npm run prisma:seed --workspace=@vyre/api
   ```

---

### Step 2: Deploy Backend API to Vercel (`apps/api`)

1. In the [Vercel Dashboard](https://vercel.com/new), import your Git repository.
2. Configure Project Settings:
   - **Project Name**: `vyre-api`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click **Edit** and choose `apps/api`
   - **Include source files outside of the Root Directory in the Build Step**: **CHECKED / YES** (required for monorepo `@vyre/shared`)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install` (or leave default)
3. Set **Environment Variables** in Vercel:

   | Variable | Value / Description | Example |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | `production` |
   | `DATABASE_URL` | Neon pooled PostgreSQL connection string | `postgresql://user:pass@ep-xyz-pooler...neon.tech/neondb?sslmode=require` |
   | `JWT_SECRET` | Secret key for JWT access tokens (min 32 chars) | `your_long_production_access_jwt_secret_key` |
   | `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens (min 32 chars) | `your_long_production_refresh_jwt_secret_key` |
   | `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
   | `CLIENT_URL` | Production frontend URL (supports comma-separated list) | `https://vyre-web.vercel.app` |
   | `API_URL` | Deployed API base URL | `https://vyre-api.vercel.app/api/v1` |
   | `SMTP_HOST` | Production SMTP hostname (optional) | `smtp.sendgrid.net` |
   | `SMTP_PORT` | SMTP port | `587` |
   | `SMTP_USER` | SMTP username | `apikey` |
   | `SMTP_PASSWORD` | SMTP password / API key | `your_smtp_key` |
   | `EMAIL_FROM` | Sender email address | `noreply@vyre.store` |
   | `EMAIL_FROM_NAME` | Sender display name | `VYRE.` |
   | `RESET_PASSWORD_URL` | Password reset frontend landing page | `https://vyre-web.vercel.app/reset-password` |

4. Click **Deploy**. Note down your deployed API URL (e.g. `https://vyre-api.vercel.app`).

---

### Step 3: Deploy Frontend Web to Vercel (`apps/web`)

1. In the [Vercel Dashboard](https://vercel.com/new), import the same Git repository again as a second project.
2. Configure Project Settings:
   - **Project Name**: `vyre-web`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `apps/web`
   - **Include source files outside of the Root Directory in the Build Step**: **CHECKED / YES** (required for monorepo `@vyre/shared`)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or leave default)
3. Set **Environment Variables** in Vercel:

   | Variable | Value / Description | Example |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | Deployed Backend API v1 endpoint | `https://vyre-api.vercel.app/api/v1` |
   | `VITE_APP_NAME` | Application display name | `VYRE` |

4. Click **Deploy**. Your storefront will be live at `https://vyre-web.vercel.app`!
5. **Backlink CORS**: If the frontend URL differs from what you originally set in `CLIENT_URL` on `vyre-api`, update `CLIENT_URL` in `vyre-api` Environment Variables and click **Redeploy**.

---

### ⚠️ Serverless Notes & Best Practices

- **Ephemeral File System**: Vercel Serverless Functions have a read-only filesystem except for `/tmp`. The API safely handles uploads in `/tmp` in serverless mode, but for persistent image storage in production, consider integrating cloud storage (e.g., Cloudinary, AWS S3, or Vercel Blob).
- **Prisma Client Caching**: PrismaClient is instantiated as a singleton attached to `globalThis` to preserve database connection pooling across warm serverless container invocations.
- **SPA Routing**: `apps/web/vercel.json` provides URL rewrites to `/index.html` ensuring direct links and page reloads work for all React Router routes.
- **CORS Support**: The backend automatically permits requests from `*.vercel.app` (including Vercel preview branch deployments) and localhost, as well as the origins listed in `CLIENT_URL`.

---

## 🇪🇬 About Brand

**VYRE** is an Egyptian streetwear and contemporary clothing brand crafted in Cairo, Egypt.
Currency standard: **EGP** (Egyptian Pound).



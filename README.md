# Deployment Playground — Single-Page Cross-Platform Architecture

A production-grade, single-page developer playground demonstrating deployment and connectivity across **Vercel** (frontend), **Render / Coolify** (backend API), and cloud database tiers (**Supabase**, **MongoDB**, **Redis**).

---

## 🏛️ Architecture

```
[ Browser Client ]
        │
        ▼ (HTTPS)
[ Next.js 15 App Router — Deployed on Vercel ]
   • Route Handler Proxy (/api/[...path])
   • Client-side instant validation
        │
        ▼ (Private / Public REST)
[ Express.js REST API — Deployed on Render or Coolify ]
   • Independent server-side validation & anti-bypass filter
   • In-memory duplicate submission locking
   • Port 5000 / Environment isolation
        │
        ├──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼
[ Supabase PostgreSQL ]    [ MongoDB Atlas ]     [ Redis Cache ]
  • Table: demo_entries      • Collection:         • Key: demo:playground:latest_entry
  • SQL queries via REST       demo_entries        • 300s automatic TTL
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v20+ (tested on Node v24)
- **npm** v10+

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your cloud credentials (optional — services report honest `not_configured` or `unavailable` states if omitted):
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# Supabase (PostgreSQL)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=deployment_playground

# Redis Instance (Upstash or Redis Cloud)
REDIS_URL=redis://default:<password>@host:port
```

### 3. Run Both Services Locally
Open two terminal windows:

**Terminal 1 — Backend (Express API):**
```bash
npm run dev:backend
# Express API runs on http://localhost:5000
```

**Terminal 2 — Frontend (Next.js):**
```bash
npm run dev:frontend
# Next.js App runs on http://localhost:3000
```

Visit **http://localhost:3000** in your browser.

---

## 🧪 Verification & Test Suite

### Run Validation Policy Tests
Tests 31 distinct validation scenarios including structural constraints, profanity filter rejections, leetspeak obfuscation, and Scunthorpe protections:
```bash
npm run test:validation
```

### Run End-to-End API Integration Tests
Tests direct Express endpoints and Next.js proxy routing:
```bash
npm run test:integration
```

---

## ☁️ Deployment Instructions

### A. Deploy Frontend to Vercel
1. Connect this repository to **Vercel**.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `EXPRESS_API_URL`: The public HTTPS URL of your Render/Coolify Express backend (e.g., `https://api-deployment-playground.onrender.com`).
4. Click **Deploy**.

### B. Deploy Backend to Render
1. In the **Render Dashboard**, select **New + → Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MONGODB_URI`, `REDIS_URL`
5. Click **Create Web Service**.

### C. Deploy Backend to Coolify
1. In your **Coolify** instance, create a new **Application** from Git repository.
2. Set Base Directory: `/backend`.
3. Build Pack: `Node.js` (or Docker).
4. Build command: `npm install && npm run build`.
5. Start command: `npm start`.
6. Set Healthcheck endpoint: `/api/health`.
7. Configure the matching environment variables.

---

## 🛡️ Validation & Security Policy

### 1. Structural Validation
- Leading and trailing whitespace is trimmed.
- Empty or whitespace-only values are rejected.
- Maximum length: **50 characters**.
- Control characters (`\u0000` to `\u001F`, `\u007F` to `\u009F`) are prohibited.

### 2. Anti-Bypass Obfuscation Filter
- **Leetspeak mapping**: Normalizes symbol substitutions (`@` → `a`, `$` → `s`, `1` → `i`, `0` → `o`, `3` → `e`, `!` → `i`, etc.).
- **Repeated separators**: Collapses punctuation or spaces between letters (e.g., `f.u.c.k`, `f-u-c-k`, `f u c k` → `fuck`).
- **Consecutive character runs**: Collapses repeated character sequences (e.g., `fuuuuuck` → `fuck`).

### 3. Protection Against the Scunthorpe Problem
Substrings resembling vulgarities inside legitimate names are **not** flagged:
- `Cassandra` (contains `ass`) → **Allowed**
- `Dickson` / `Dickens` (contains `dick`) → **Allowed**
- `Titus` (contains `tit`) → **Allowed**
- `Hancock` / `Peacock` (contains `cock`) → **Allowed**
- `Butter` (contains `butt`) → **Allowed**
- `Pass` / `Classic` (contains `ass`) → **Allowed**

### 4. Defense in Depth
The Express backend independently validates every write request even if the client-side check is bypassed. Offensive inputs return an HTTP 400 Bad Request with a respectful error message and are **never logged or echoed back**.

> **Moderation Disclaimer**: Automated profanity detection is heuristic and imperfect. It is designed to prevent disruptive and offensive submissions during live deployment demonstrations, but is not a substitute for human moderation, organization-specific policies, or comprehensive security controls.

---

## 📂 Project Structure

```
HOSTING/
├── backend/
│   ├── src/
│   │   ├── config/env.ts              # Safe environment variable parsing
│   │   ├── db/
│   │   │   ├── supabase.ts            # Supabase PostgreSQL client & queries
│   │   │   ├── mongodb.ts             # MongoDB Atlas client & operations
│   │   │   └── redis.ts               # Redis cache integration with 300s TTL
│   │   ├── middleware/
│   │   │   └── dedup.ts               # In-memory duplicate submission lock
│   │   ├── routes/
│   │   │   ├── health.ts              # /api/health and /api/health/ready
│   │   │   ├── services.ts            # /api/services/status
│   │   │   └── demo.ts                # Demo endpoints for each database
│   │   ├── validation/
│   │   │   ├── profanityList.ts       # Curated dictionary & exemptions
│   │   │   └── nameValidator.ts       # Normalization & validation logic
│   │   ├── server.ts                  # Express entry point
│   │   └── testValidator.ts           # 31-case validation test runner
│   ├── schema.sql                     # Supabase table schema and RLS policies
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/[...path]/route.ts # Next.js reverse proxy route handler
│   │   │   ├── globals.css            # Tailwind CSS v4 developer dark theme
│   │   │   ├── layout.tsx             # Root layout with metadata
│   │   │   └── page.tsx               # Single-page deployment playground
│   │   ├── components/
│   │   │   ├── Header.tsx             # Architecture flow banner
│   │   │   ├── ServiceStatusSection.tsx # Section A: Service connectivity
│   │   │   ├── DatabasePlaygroundSection.tsx # Section B: DB Playground & presets
│   │   │   ├── ConsoleLogger.tsx      # Real-time event & network activity log
│   │   │   └── ValidationPolicyDisclosure.tsx # Policy specification
│   │   └── lib/
│   │       ├── apiClient.ts           # Frontend HTTP client
│   │       ├── nameValidator.ts       # Client-side validation mirror
│   │       └── profanityList.ts       # Curated words & exemptions
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env.local
│
├── package.json                       # Monorepo root orchestration scripts
├── testEndpoints.mjs                  # Integration test suite
└── README.md
```

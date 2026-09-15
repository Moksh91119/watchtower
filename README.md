# Watchtower

> A full-stack website change monitoring platform that periodically checks webpages, detects meaningful changes, and notifies users when something changes.

Watchtower lets users monitor webpages for changes without manually checking them.

Users can create monitors for:

- Company announcements
- Pricing pages
- Product pages
- Documentation
- Job listings
- Blog posts
- Any other publicly accessible webpage

When a monitored page changes, Watchtower stores the new snapshot, calculates the difference from the previous version, classifies the severity of the change, and can send an email notification.

---

## Features

### Website Monitoring

Create monitors for any publicly accessible webpage.

Supported monitoring modes:

- **Full Page** — monitors the entire page
- **Text** — monitors the meaningful text content
- **CSS Selector** — monitors a specific section of a webpage

### Change Detection

Watchtower compares the latest snapshot with the previous snapshot using:

- SHA-256 content hashing
- Normalized webpage content
- Word-level diffing
- Change percentage
- Change severity classification

Changes are classified as:

| Severity | Change     |
| -------- | ---------- |
| Minor    | `< 5%`     |
| Moderate | `5% – 20%` |
| Major    | `> 20%`    |

### Snapshot History

Every successful check can produce a snapshot containing:

- Content hash
- Text content
- HTML content
- Content size
- Creation timestamp

This allows Watchtower to compare the current state of a webpage against its previous state.

### Check History

Each monitoring attempt records:

- Check status
- HTTP status code
- Response time
- Whether the page changed
- Error information
- Check timestamp

### Email Notifications

When a meaningful change is detected, Watchtower can send an email notification through Resend.

### Monitor Management

Users can:

- Create monitors
- Edit monitors
- Pause/resume monitors
- Delete monitors
- View monitor details
- View check history
- View detected changes

### Authentication

The API provides authentication using:

- Email/password registration
- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- User-scoped monitor access

### Dashboard

The dashboard provides an overview of:

- Total monitors
- Active monitors
- Recent checks
- Recent changes
- Monitor status

---

# Architecture

Watchtower is structured as a monorepo containing separate frontend, API, worker, database, and shared-code packages.

```text
                         ┌──────────────────────┐
                         │      Next.js Web      │
                         │       Frontend        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / REST
                                    ▼
                         ┌──────────────────────┐
                         │     Fastify API       │
                         │       Backend         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     PostgreSQL        │
                         │       Database        │
                         └──────────▲───────────┘
                                    │
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
        ┌────────┴─────────┐                  ┌────────┴─────────┐
        │  GitHub Actions  │                  │      Resend      │
        │  Scheduled Job   │                  │  Email Delivery  │
        └────────┬─────────┘                  └──────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Watchtower       │
        │      Worker        │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │    Target Website  │
        │       Fetch        │
        └────────────────────┘
```

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

## Backend

- Node.js
- Fastify
- TypeScript
- JWT
- bcryptjs
- Zod

## Worker

- Node.js
- TypeScript
- Cheerio
- Native `fetch`
- SHA-256 hashing
- `diff` for content comparison

## Database

- PostgreSQL
- Drizzle ORM
- Drizzle Kit

## Infrastructure

- Vercel — frontend
- Render — API
- Render PostgreSQL — production database
- GitHub Actions — scheduled worker execution
- Resend — email delivery

---

# Project Structure

```text
watchtower/
│
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Fastify REST API
│   └── worker/              # Website monitoring worker
│
├── packages/
│   ├── db/                  # Drizzle schema and database client
│   └── shared/              # Shared Zod schemas/types
│
├── .github/
│   └── workflows/
│       └── worker.yml       # Scheduled worker execution
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

---

# How It Works

A typical monitoring cycle looks like this:

```text
1. Scheduler finds monitors that are due
                ↓
2. Worker fetches the target webpage
                ↓
3. Content is normalized
                ↓
4. SHA-256 hash is generated
                ↓
5. Latest snapshot is retrieved
                ↓
6. Hashes are compared
                ↓
        ┌───────┴────────┐
        │                │
     No Change         Changed
        │                │
        │                ▼
        │          Generate diff
        │                │
        │                ▼
        │          Calculate %
        │                │
        │                ▼
        │          Classify severity
        │                │
        │                ▼
        │          Store change
        │                │
        │                ▼
        │          Send notification
        │
        ▼
    Store check
```

The worker also records failed checks and schedules the monitor for another attempt.

---

# Database Model

The application uses PostgreSQL with Drizzle ORM.

Core entities:

```text
users
  │
  ├── monitors
  │      │
  │      ├── checks
  │      │
  │      ├── snapshots
  │      │
  │      └── changes
  │
  ├── notifications
  │
  └── sessions
```

### Main Tables

| Table           | Purpose                                |
| --------------- | -------------------------------------- |
| `users`         | Application users                      |
| `sessions`      | User authentication sessions           |
| `monitors`      | Website monitoring configuration       |
| `checks`        | Individual monitoring attempts         |
| `snapshots`     | Stored versions of webpage content     |
| `changes`       | Differences detected between snapshots |
| `notifications` | Email notification records             |

---

# API

The backend exposes a REST API.

### Health

```http
GET /health
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### Monitors

```http
GET    /api/monitors
POST   /api/monitors
GET    /api/monitors/:id
PATCH  /api/monitors/:id
DELETE /api/monitors/:id
```

### Monitor Data

```http
GET /api/monitors/:id/checks
GET /api/monitors/:id/changes
```

Protected endpoints require a valid JWT.

---

# Local Development

## Prerequisites

Make sure you have installed:

- Node.js
- pnpm
- PostgreSQL

Check your versions:

```bash
node --version
pnpm --version
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Moksh91119/watchtower.git
cd watchtower
```

Install dependencies:

```bash
pnpm install
```

---

# Environment Variables

Create a `.env` file in the repository root.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

JWT_SECRET=your-development-secret

WEB_URL=http://localhost:3000

RESEND_API_KEY=your-resend-api-key

EMAIL_FROM=Watchtower <onboarding@resend.dev>
```

For the frontend, create:

```text
apps/web/.env.local
```

with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Do not commit environment files containing secrets.

---

# Database Setup

Generate migrations:

```bash
pnpm --filter @watchtower/db generate
```

Run migrations:

```bash
pnpm --filter @watchtower/db migrate
```

For local development, the database can also be pushed directly:

```bash
pnpm --filter @watchtower/db push
```

---

# Running the Application

Start the development environment:

```bash
pnpm dev
```

This starts the workspace applications in parallel.

The main services are:

```text
Frontend → http://localhost:3000
API      → http://localhost:4000
```

The monitoring worker can be executed independently:

```bash
pnpm --filter @watchtower/worker dev
```

---

# Building

Build all packages:

```bash
pnpm build
```

Run type checking:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

---

# Background Worker

Watchtower separates monitoring execution from the API.

The worker is intentionally designed as a **one-shot process**.

Each execution:

1. Finds monitors whose `next_check_at` is due.
2. Claims the monitors.
3. Fetches their webpages.
4. Compares the current content against the previous snapshot.
5. Stores checks and snapshots.
6. Creates change records when necessary.
7. Sends email notifications.
8. Schedules the next check.
9. Exits.

This makes the worker suitable for scheduled execution environments.

---

# Scheduled Execution

The production worker is executed using GitHub Actions.

The workflow is located at:

```text
.github/workflows/worker.yml
```

The workflow runs periodically and executes:

```bash
pnpm --filter @watchtower/worker start
```

Required GitHub Actions secrets:

```text
DATABASE_URL
RESEND_API_KEY
EMAIL_FROM
```

The production worker uses the **external PostgreSQL connection** because GitHub Actions runs outside the Render network.

---

# Deployment

## Frontend — Vercel

The Next.js application is deployed from:

```text
apps/web
```

Production environment variable:

```env
NEXT_PUBLIC_API_URL=https://watchtower-api-tm3s.onrender.com
```

Vercel handles the Next.js build and deployment.

---

## API — Render

The Fastify API is deployed as a Render Web Service.

Start command:

```bash
pnpm --filter @watchtower/api start
```

Production environment variables include:

```env
DATABASE_URL=...
JWT_SECRET=...
WEB_URL=https://watchtower-web-eta.vercel.app
```

The API listens on the Render-provided `PORT`.

---

## Worker — GitHub Actions

The worker does not run as a persistent Render Background Worker.

Instead, GitHub Actions periodically starts the worker, allowing the project to run without paying for a dedicated background worker.

```text
GitHub Actions
      │
      │ scheduled execution
      ▼
Build Worker
      │
      ▼
Run Worker
      │
      ▼
Render PostgreSQL
      │
      ▼
Exit
```

---

# Security Considerations

Watchtower implements several basic security measures:

- Password hashing using bcrypt
- JWT authentication
- Protected API routes
- User-scoped database queries
- CORS configuration
- Helmet security headers
- Environment-based secrets
- Foreign-key constraints
- Cascading deletes for owned resources

Secrets are kept outside the repository using environment variables and deployment-provider secrets.

---

# Design Decisions

### Why a separate worker?

Website monitoring is background work and should not block API requests.

Separating the worker allows:

- Independent execution
- Scheduled processing
- Better failure isolation
- Easier scaling
- Cleaner API architecture

### Why store snapshots?

Storing only the latest hash would tell us that something changed, but not **what changed**.

Snapshots allow Watchtower to generate meaningful diffs between versions.

### Why GitHub Actions?

The worker is a short-lived scheduled process rather than a continuously running server.

GitHub Actions provides scheduled execution without requiring a dedicated background server.

### Why PostgreSQL?

The application has several relational entities with strong relationships:

```text
User → Monitor → Check
              → Snapshot
              → Change
              → Notification
```

PostgreSQL provides the relational constraints and indexing required for these relationships.

---

# Future Improvements

Potential improvements include:

- HTTP conditional requests using `ETag` and `Last-Modified`
- Smarter change filtering
- JavaScript-rendered webpage monitoring
- Screenshot-based visual monitoring
- Slack/Discord notifications
- Webhook notifications
- Notification preferences
- Monitor tags and folders
- Advanced scheduling
- Monitoring analytics
- Rate limiting
- Retry policies
- Improved diff visualization
- API documentation with OpenAPI
- Automated integration tests
- Queue-based worker architecture

---

# License

This project is available for portfolio and educational purposes.

---

## Author

**Moksh Jain**

Frontend & Full Stack Developer

Built with:

- TypeScript
- React
- Next.js
- Node.js
- Fastify
- PostgreSQL
- Drizzle ORM
- GitHub Actions

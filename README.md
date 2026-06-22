# StoreX Backend

Multi-tenant e-commerce automation SaaS backend inspired by StoreX. Built with NestJS, Prisma, PostgreSQL, Redis (BullMQ), and Sharp.

## Features

- **Authentication** — JWT access & refresh tokens, OTP via SMS, password reset
- **Multi-Tenancy** — Merchants, Stores, Employees with role-based access control
- **Catalog** — Categories, Brands, Products with variants, images, tags, bulk import
- **Customers** — CRUD, block/unblock, fraud scoring integration
- **Orders** — Lifecycle management, duplicate detection, stock adjustment, invoice PDF generation
- **Fraud Detection** — Customer scoring based on cancellations, returns, incomplete orders, phone patterns
- **Offers** — Coupons (percentage/fixed) with usage limits, Campaigns
- **Payments** — bKash, Nagad, SSLCommerz gateway integrations with encrypted config
- **Courier** — Steadfast, Pathao, RedX, ECourier, Bahok adapters with booking, tracking, rate estimation
- **Marketing** — Bulk SMS (SSL Wireless), Email (Nodemailer/SMTP), WhatsApp (Graph API) via BullMQ queues
- **Tracking** — Facebook CAPI, Google Analytics 4 (Measurement Protocol), pixel config
- **Analytics** — Dashboard aggregations, sales charts, target vs actual reports
- **Uploads** — Local & Cloudflare R2 drivers, Sharp image pipeline (WebP conversion, thumbnails, responsive sizes)
- **Landing Pages** — CRUD with templates, SEO meta, publish toggle
- **Targets** — Sales target tracking
- **Notifications** — Real-time WebSocket gateway, in-app notification center
- **Incomplete Orders** — Cart abandonment trap and follow-up tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| Auth | Passport JWT |
| API Docs | Swagger / OpenAPI |
| Image Processing | Sharp |
| WebSocket | Socket.IO |
| Security | Helmet, Throttler, bcrypt |

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `STORAGE_DRIVER` | `local` or `r2` |
| `ENCRYPTION_KEY` | 32-char hex key for encrypting gateway configs |
| `APP_PORT` | Server port (default 3000) |

### 3. Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start the Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api/v1`

Swagger docs at `http://localhost:3000/docs`

## Project Structure

```
src/
├── common/           # Guards, filters, interceptors, decorators, utils
├── prisma/           # Prisma service & module
├── auth/             # JWT auth, OTP, password reset
├── merchants/        # Merchant profile management
├── stores/           # Store CRUD, domain mapping
├── employees/        # Employee CRUD with roles & permissions
├── catalog/          # Categories, brands, products
├── customers/        # Customer management
├── orders/           # Order lifecycle, invoices
├── fraud/            # Fraud scoring & blocking
├── offers/           # Coupons & campaigns
├── payments/         # bKash, Nagad, SSLCommerz
├── courier/          # Courier adapters & booking
├── marketing/        # SMS, email, WhatsApp
├── tracking/         # Facebook CAPI, GA4
├── analytics/        # Dashboards & reports
├── uploads/          # File storage (local/R2) + Sharp pipeline
├── incomplete-orders/# Cart abandonment trap
├── landing-pages/    # Landing page builder
├── targets/          # Sales targets
├── notifications/    # WebSocket notifications
├── queue/            # BullMQ queues & processors
├── app.module.ts     # Root module
└── main.ts           # Entry point
```

## API Conventions

- **Base URL**: `/api/v1`
- **Auth**: Bearer JWT token (`Authorization: Bearer <token>`)
- **Response format**: `{ success, statusCode, data, timestamp }`
- **Pagination**: `?page=1&limit=20&search=keyword`
- **Store-scoped routes**: `/stores/:storeId/...` (protected by `StoreAccessGuard`)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run start:dev` | Start with hot reload |
| `npm run start:prod` | Run compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier formatting |
| `npm test` | Run Jest tests |

## License

UNLICENSED

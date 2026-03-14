# Core Inventory — Inventory Management System

A modular, full-stack Inventory Management System built with React + Node.js + PostgreSQL. Designed to replace manual registers and spreadsheets with a centralized, real-time, easy-to-use app for inventory managers and warehouse staff.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Query, React Router, Recharts, @dnd-kit
- **Backend:** Node.js, Express.js, Prisma ORM, Nodemailer
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens), bcrypt, OTP password reset
- **Export:** PDF (pdfkit), CSV (json2csv)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

Create a PostgreSQL database called `core_inventory`:

```sql
CREATE DATABASE core_inventory;
```

### 2. Server Setup

```bash
cd server
npm install
# Edit .env — update DATABASE_URL if needed
npx prisma migrate dev
npm run db:seed       # Seeds sample data
npm run dev           # Starts on port 5000
```

### 3. Client Setup

```bash
cd client
npm install
npm run dev           # Starts on port 5173
```

### 4. Access the App

Open http://localhost:5173

**Demo accounts** (seeded):
| Email | Password | Role |
|-------|----------|------|
| manager@coreinventory.com | password123 | Inventory Manager |
| staff@coreinventory.com | password123 | Warehouse Staff |

> New user accounts are created by the admin (Inventory Manager) from **Settings → User Management**. There is no public signup.

### 5. Email Configuration (Optional)

To enable OTP emails and low-stock alerts, configure SMTP in `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

If not configured, OTP codes are logged to the server console as a fallback.

## Features

### Core Modules

- **Dashboard** — KPI cards, top moving products chart, category breakdown pie chart, low stock alerts, recent operations with filters (type, status, warehouse, location), date range filter (Today/7d/30d/All + custom), downloadable monthly report
- **Products** — CRUD with SKU, category, unit of measure, cost price, reorder rules, stock per location, stock level history chart, bulk CSV import, export (CSV/PDF)
- **Receipts** — Create incoming stock from suppliers, validate to auto-increase stock
- **Deliveries** — Outgoing shipments with real-time stock validation, auto-decrease stock on validate
- **Internal Transfers** — Move stock between locations/warehouses with audit logging
- **Stock Adjustments** — Reconcile physical counts with recorded stock
- **Move History** — Immutable stock ledger with full audit trail, export support

### Operations & Stock

- Real-time stock validation with current stock display and insufficient stock warnings
- Drag & drop reordering of operation line items
- Auto-refresh stock levels every 10 seconds for pending operations
- Cascading product deletion (removes associated stock levels, operation lines, and history)

### User Management & Security

- **Admin-only user creation** — No public signup; managers create accounts via Settings
- **Role-based access control** — Inventory Manager (full access) vs Warehouse Staff (restricted)
  - Staff cannot: create receipts/deliveries, delete products, manage categories/warehouses/users, access settings
  - Staff can: view all data, create transfers/adjustments, manage their profile
- **User enable/disable** — Managers can deactivate users without deleting them; disabled users cannot log in
- **Session-based auth** — Auto-logout when the browser is closed (sessionStorage)
- **Rate limiting** — Login, OTP, and API endpoints are rate-limited
- **JWT with refresh tokens** — 15-minute access tokens with 7-day refresh rotation

### Analytics & Reporting

- **Dashboard date range filter** — Quick presets (Today, 7 Days, 30 Days, All) + custom date pickers
- **Top moving products chart** — Horizontal bar chart with configurable period (7/14/30/90 days)
- **Stock by category** — Donut chart with breakdown
- **Product stock history** — Line chart on product detail page showing balance over time
- **Monthly inventory report** — Downloadable PDF with opening stock, received, dispatched, adjustments, and closing stock per product
- **Inventory valuation** — Per-warehouse and per-product cost valuation
- **Export** — Products, operations, move history, and stock reports in CSV or PDF

### UX Improvements

- **Dark mode** — Full dark theme with toggle, comprehensive contrast-optimized styling
- **Loading skeletons** — Shimmer placeholders on dashboard, product list, product detail, and operation pages
- **Confirmation modals** — Styled modals replace browser confirm() dialogs throughout
- **Breadcrumbs** — Navigation path on products, product detail, and operation pages
- **Empty states** — Illustrated placeholders when lists are empty
- **Search debounce** — 400ms debounce on product search, Enter to search immediately
- **Command palette** — Ctrl+K quick navigation
- **Toast notifications** — Success/error feedback with dark mode support
- **Responsive design** — Mobile-friendly layout with collapsible sidebar

### Communication & Alerts

- **Email OTP** — Password reset codes sent via Nodemailer (falls back to console log)
- **Low stock email alerts** — Automated every 6 hours + on server startup; notifies all active managers with a styled HTML email listing products at or below reorder point
- **In-app alerts** — Bell icon with real-time low stock / out of stock count

## Project Structure

```
core_inventory/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # UI components (layout, shared, ui)
│       ├── context/           # Auth, Theme, Toast providers
│       ├── lib/               # API client, utilities
│       ├── pages/             # Page components by module
│       └── routes/            # Route definitions
├── server/                    # Express backend
│   ├── prisma/                # Schema, migrations, seed
│   └── src/
│       ├── controllers/       # Route handlers
│       ├── middleware/         # Auth, validation, rate limiting, errors
│       ├── routes/            # API route definitions
│       ├── services/          # Stock alert service
│       └── utils/             # Prisma client, mailer, helpers
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/refresh | Public | Refresh JWT |
| POST | /api/auth/forgot-password | Public | Request OTP |
| POST | /api/auth/reset-password | Public | Reset with OTP |
| GET | /api/dashboard | Auth | Dashboard KPIs & operations |
| GET/POST/PUT/DELETE | /api/products | Auth | Product CRUD |
| GET/POST/PUT/DELETE | /api/categories | Auth (Manager for CUD) | Category CRUD |
| GET/POST | /api/operations/* | Auth (Manager for receipts/deliveries) | Stock operations |
| POST | /api/operations/:id/validate | Auth | Validate operation |
| GET | /api/move-history | Auth | Stock movement ledger |
| GET/POST/PATCH/DELETE | /api/users | Auth (Manager) | User management |
| GET/POST/DELETE | /api/warehouses | Auth (Manager) | Warehouse/location CRUD |
| GET | /api/warehouse-stock | Auth | Stock by warehouse |
| GET | /api/analytics/* | Auth | Charts & analytics |
| GET | /api/export/* | Auth | CSV/PDF exports |
| GET | /api/alerts | Auth | Low stock alerts |
| GET/PUT | /api/profile | Auth | User profile |
| GET | /api/activity-logs | Auth | Activity log |

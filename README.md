# Core Inventory — Inventory Management System

A modular, full-stack Inventory Management System built with React + Node.js + PostgreSQL.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Query, React Router
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens), bcrypt, simulated OTP

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
cp .env .env.local   # Edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init
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

## Features

- **Dashboard** — KPI cards, low stock alerts, recent operations with filters
- **Products** — CRUD, categories, SKU search, stock per location, reorder rules
- **Receipts** — Create incoming stock from suppliers, validate to auto-increase stock
- **Deliveries** — Outgoing shipments, validate to auto-decrease stock
- **Internal Transfers** — Move stock between locations/warehouses
- **Stock Adjustments** — Reconcile physical counts with recorded stock
- **Move History** — Immutable stock ledger with full audit trail
- **Alerts** — Low stock / out of stock notifications
- **Multi-warehouse** — Support for multiple warehouses and locations
- **Role-based Access** — Inventory Manager (full) vs Warehouse Staff (restricted)
- **Profile** — View/edit profile, change password
- **OTP Password Reset** — Simulated (console-logged)

## Project Structure

```
core_inventory/
├── client/          # React frontend (Vite)
├── server/          # Express backend
│   ├── prisma/      # Database schema & seeds
│   └── src/         # Controllers, routes, middleware
└── README.md
```

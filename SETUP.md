# MOCI Inventory Management System — Setup Guide

## Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **npm** (comes with Node.js)
- **PostgreSQL** 14+ (optional — SQLite is used by default for easy setup)

---

## Quick Start (SQLite — No DB Install Needed)

```bash
cd server
cp .env.example .env
npm install
npm start
```

That's it! The server starts on **http://localhost:5000** with SQLite, auto-creates all tables, and seeds a default admin user.

Then in a second terminal:

```bash
cd client
npm install
npm start
```

The client opens at **http://localhost:3000**.

---

## Production Setup (PostgreSQL)

### 1. Create a PostgreSQL database

```sql
CREATE DATABASE moci_inventory;
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moci_inventory
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=change_this_to_a_long_random_string
```

### 3. Start

```bash
npm install
npm start
```

---

## Production Build (Single Server)

Build the React client and serve it from Express:

```bash
cd client
npm install
npm run build
```

The `client/build/` folder is automatically served by the Express server. Access everything from **http://localhost:5000**.

---

## Default Login

| Email | Password | Role |
|-------|----------|------|
| admin@moci.local | admin123 | Admin |

Change this password in production!

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |
| DB_DIALECT | sqlite | Database: `sqlite` or `postgres` |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | moci_inventory | PostgreSQL database name |
| DB_USER | postgres | PostgreSQL user |
| DB_PASSWORD | - | PostgreSQL password |
| JWT_SECRET | - | JWT signing secret (required) |
| JWT_EXPIRES_IN | 24h | Token expiry |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origin |

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Current user
- `POST /api/auth/register` — Create user (admin only)
- `GET /api/auth/users` — List users (admin only)

### Products
- `GET /api/products` — List (with ?search=&page=&limit=)
- `POST /api/products` — Create (admin)
- `PUT /api/products/:id` — Update (admin)
- `DELETE /api/products/:id` — Delete (admin)

### Warehouses
- `GET /api/warehouses` — List
- `POST /api/warehouses` — Create (admin)
- `PUT /api/warehouses/:id` — Update (admin)
- `DELETE /api/warehouses/:id` — Delete (admin)

### Transactions
- `GET /api/transactions` — List (with ?search=&type=&warehouseId=&dateFrom=&dateTo=&page=&limit=)
- `POST /api/transactions` — Create
- `PUT /api/transactions/:id` — Update
- `DELETE /api/transactions/:id` — Delete

### Dashboard
- `GET /api/dashboard/summary` — Dashboard stats

### Export (MOCI Integration)
- `GET /api/export/json` — Export as JSON
- `GET /api/export/csv` — Export as CSV download
- `GET /api/export/api` — API endpoint for MOCI agent

All export endpoints accept: `?dateFrom=&dateTo=&type=&warehouse=`

### Audit
- `GET /api/audit` — Audit logs (admin only)

---

## MOCI Integration

The `SupplierTransactions` table follows the MOCI unified format exactly. Every transaction created automatically populates this table with all 21 required MOCI fields. Use the Integration Export page or the API endpoints to send data to the MOCI system.

### Export Formats
- **JSON** — For API-based integration
- **CSV** — For file-based import (includes BOM for Arabic/Excel compatibility)
- **API Endpoint** — Direct REST endpoint for automated integration agents

---

## Project Structure

```
inventory-system/
  server/
    src/
      config/          # Database configuration
      controllers/     # API logic (auth, products, warehouses, transactions, dashboard, export, audit)
      middleware/       # JWT authentication & role authorization
      models/          # Sequelize models (User, Product, Warehouse, Transaction, SupplierTransaction, AuditLog)
      routes/          # Express route definitions
      utils/           # Audit logger, SQLite compatibility layer
    .env.example       # Environment template
    package.json
  client/
    src/
      components/      # Layout, Modal
      contexts/        # AuthContext, LangContext (i18n)
      i18n/            # English + Arabic translations
      pages/           # Login, Dashboard, Products, Warehouses, Transactions, Integration, Audit, Users
      utils/           # Axios API client
    build/             # Production build (pre-built)
    package.json
```

---

## Features

- User authentication with JWT
- Role-based access (Admin / Staff)
- Product management (CRUD)
- Warehouse management (CRUD)
- Transaction management with auto-fill from products
- MOCI SupplierTransactions table (auto-populated)
- Dashboard with stats, recent activity, and breakdowns
- Export to JSON, CSV, and API endpoint
- Full audit logging
- Bilingual UI (English + Arabic with RTL support)
- Responsive design (desktop + tablet)
- Rate limiting and security headers
- SQLite for easy development, PostgreSQL for production

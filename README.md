# ConstructPro — Construction ERP Management System

A full-featured desktop ERP application for construction businesses, built with Electron, React, and NestJS.

---

## Features

- **Dashboard** — Real-time overview of projects, finances, and operations
- **Project Management** — Track projects, milestones, expenses, labour, and machinery
- **HR & Payroll** — Employees, labour attendance, salary processing
- **Inventory** — Stock management with low-stock alerts and transactions
- **Finance** — Income, expense, accounts, journal entries, chart of accounts
- **Customers & Suppliers** — Ledgers, transactions, invoices, purchase orders
- **Assets** — Machinery, vehicles, plants with maintenance tracking
- **Tax Records** — Track tax obligations and payments
- **Reports** — Financial and operational reports with PDF export
- **Roles & Permissions** — Fine-grained access control per module
- **Audit Logs** — Full activity history
- **Search by Code** — All list pages support searching by entity code (e.g. `EMP-001`, `INV-003`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron 43 |
| Frontend | React 18, TypeScript, MUI v6, Redux Toolkit |
| Backend | NestJS, Prisma ORM |
| Database | SQLite (via better-sqlite3, N-API prebuilt) |
| Build | Vite, electron-builder (NSIS installer) |

---

## Installation (End Users)

1. Download `ConstructPro Setup 1.1.0.exe`
2. Double-click and follow the installer
3. Launch **ConstructPro** from the desktop shortcut
4. Login with default credentials:
   - **Email:** `admin@constructpro.com`
   - **Password:** `Admin@123456`
5. Change the admin password after first login

> **Requirements:** Windows 10/11 (64-bit), 4 GB RAM minimum. No additional software needed.

---

## Adding Users (Client Setup)

1. Login as admin
2. Go to **Users** in the sidebar
3. Click **Add User**, fill in name, email, password, and role
4. The new user can now login with their own credentials

---

## Development Setup

### Prerequisites

- Node.js v18+
- npm v9+

### Install Dependencies

```bash
# Root (Electron)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Run in Development

```bash
# Start backend
cd backend && npm run start:dev

# Start frontend (in a new terminal)
cd frontend && npm run dev

# Start Electron (in a new terminal)
npm run electron:dev
```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
DATABASE_URL=file:./constructpro.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
PORT=3000
```

---

## Building the Installer

```bash
# Full build (frontend + backend + bundle + installer)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist
```

Output: `dist-electron/ConstructPro Setup 1.1.0.exe`

> **Note:** Always use `CSC_IDENTITY_AUTO_DISCOVERY=false` to prevent Windows code-signing from hanging the build.

### What the build does

1. Builds the React frontend → `backend/public/`
2. Compiles the NestJS backend → `backend/dist/`
3. Creates `backend-bundle/` with production deps, fresh DB, and admin seed
4. Packages everything into a Windows NSIS installer via electron-builder

---

## Keyboard Shortcuts (Desktop App)

| Shortcut | Action |
|---|---|
| `F5` | Refresh page |
| `Ctrl + R` | Refresh page |
| `Ctrl + Shift + R` | Hard refresh (clear cache) |

---

## Project Structure

```
ConstructPro/
├── electron/           # Electron main process
│   └── main.js         # App entry, backend spawning, window management
├── frontend/           # React frontend (Vite + TypeScript)
│   └── src/
│       ├── features/   # Feature modules (one folder per domain)
│       ├── store/      # Redux store
│       └── types/      # Shared TypeScript types
├── backend/            # NestJS backend
│   ├── src/            # Source code (one folder per module)
│   ├── prisma/         # Schema and migrations
│   └── public/         # Built frontend (auto-generated)
├── scripts/
│   ├── prepare-backend.js   # Bundles backend for packaging
│   └── after-pack.js        # Enables Electron RunAsNode fuse
└── package.json        # Root package (Electron + build config)
```

---

## Default Credentials

| Field | Value |
|---|---|
| Email | `admin@constructpro.com` |
| Password | `Admin@123456` |

> Change these immediately after installation on a production system.

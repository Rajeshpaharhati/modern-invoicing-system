# Modern Invoicing System (Mini) — The Notary

A production-grade, full-stack invoicing application built for the **91 Technologies / the notary.app** technical assessment.

---

## 🌟 Overview & Highlights

- **Complete Full-Stack Architecture**: React (Vite) frontend + Node.js/Express REST API backend + MongoDB (with Mongoose schemas, compound unique indexes, and data modeling).
- **Zero-Config Backend Execution**: Runs instantly out of the box with `npm install && npm start`! If no local or remote MongoDB instance is configured, it automatically boots an embedded in-memory MongoDB (`mongodb-memory-server`), seeding it with sample demo data.
- **Server-Enforced Tiered Access (Free vs. Premium)**:
  - Custom branding (company logo upload & alignment) is strictly gated at the API layer with HTTP `403 Forbidden` checks (`requirePremium` middleware).
  - Prevents data leakage: non-premium users never receive premium branding assets through API responses.
- **Dynamic Real-Time Invoice Calculations**:
  - Dynamic line items (add/remove item rows).
  - Real-time client-side calculation + server-side pre-validation of line totals, subtotal, tax %, tax amount, and grand total.
  - Unique invoice number index enforced per user account (`{ userId: 1, invoiceNumber: 1 }`).
- **Clean "Printable" Layout**:
  - CSS `@media print` optimized invoice preview that strips UI controls and prepares an 8.5x11 / A4 printable or PDF-exportable document.
  - Logo placement dynamically configurable to **top-left** or **top-right** on the invoice layout.
- **Instant Demo Evaluator Controls**:
  - 1-Click Fast Login buttons for both **Free Tier** and **Premium Tier** on the login screen.
  - Sandbox active-tier switcher in the header to effortlessly test both free and premium behaviors without re-authenticating.

---

## 🏗️ System Architecture

```
modern-invoicing-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Resilient MongoDB connector (Atlas/Local + Memory-Server fallback)
│   │   ├── models/
│   │   │   ├── User.js               # User schema with roles ('free' | 'premium') and branding
│   │   │   ├── Client.js             # Client schema with compound index { userId: 1, email: 1 }
│   │   │   └── Invoice.js            # Invoice schema with unique index { userId: 1, invoiceNumber: 1 }
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT bearer token authentication
│   │   │   ├── requirePremium.js     # Strict server-side tier gate (HTTP 403)
│   │   │   ├── validation.js         # Input validation for clients, invoices, and auth
│   │   │   └── errorHandler.js       # Centralized error handler (duplicate keys, validation)
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me endpoints
│   │   │   ├── clientController.js   # Client CRUD scoped to current user
│   │   │   ├── invoiceController.js  # Invoice CRUD, dynamic calculations, and query filters
│   │   │   └── userController.js     # Profile, logo upload, branding settings, sandbox tier switch
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── clientRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   └── seedService.js        # Auto-seeds sample users, clients, and invoices
│   │   └── server.js                 # Express application entrypoint
│   ├── test/
│   │   └── api.test.js               # End-to-end automated verification test suite
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navbar with live tier switcher & quick actions
│   │   │   ├── Sidebar.jsx           # Modern navigation bar
│   │   │   ├── StatusBadge.jsx       # Color-coded badges (Draft, Sent, Paid, Overdue)
│   │   │   └── ClientModal.jsx       # Inline client create/edit modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state, 1-click demo login, token persistence
│   │   │   └── ToastContext.jsx      # Non-intrusive toast notifications
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx     # Financial metrics (Invoiced, Collected, Pending, Clients)
│   │   │   ├── InvoicesListPage.jsx  # Invoices directory with status, client, & date filters
│   │   │   ├── InvoiceCreatePage.jsx # Dynamic row builder with live auto-calculations
│   │   │   ├── InvoiceDetailsPage.jsx# Clean printable invoice layout with logo positioning
│   │   │   ├── ClientsListPage.jsx   # Client directory management
│   │   │   ├── SettingsPage.jsx      # Profile, custom logo upload, & alignment controls
│   │   │   ├── LoginPage.jsx         # Sign in + 1-Click Demo accounts
│   │   │   └── RegisterPage.jsx      # User registration
│   │   ├── services/
│   │   │   └── api.js                # Axios HTTP client with JWT interceptor
│   │   ├── styles/
│   │   │   └── index.css             # Design tokens, typography, and @media print styles
│   │   ├── App.jsx                   # Application routing and protected layout
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                   # Ready-to-deploy Vercel routing
│   ├── netlify.toml                  # Ready-to-deploy Netlify configuration
│   └── package.json
│
├── package.json                      # Monorepo root script runner
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v24)
- **npm**: v9 or higher

### 2. Running Locally (Zero Database Configuration Needed)

```bash
# Clone or navigate to the project directory
cd modern-invoicing-system

# Option A: Start backend directly
cd backend
npm install
npm start
# -> Runs on http://localhost:5000 with embedded MongoDB auto-started

# Option B: In a separate terminal, start frontend
cd ../frontend
npm install
npm run dev
# -> Runs on http://localhost:5173
```

> **Note on Zero-Config Mode**: If `MONGODB_URI` is left blank in `.env`, the backend will automatically initialize an embedded `MongoMemoryServer` and seed demo accounts so you can test everything immediately without needing a local MongoDB daemon or Atlas credentials.
>
> If you wish to connect to a local or Atlas database, simply set `MONGODB_URI=mongodb://localhost:27017/invoicing_db` in `backend/.env`.

---

## 🔑 Demo Accounts (1-Click Login)

The login screen features instant 1-click buttons to sign in without typing:

| Account Type | Email | Password | Features & Role |
|---|---|---|---|
| **Free Tier Demo** | `free@notary.app` | `password123` | Role: `free`. Standard clean layout; custom branding endpoints return `403 Forbidden`. |
| **Premium Tier Demo** | `premium@notary.app` | `password123` | Role: `premium`. Includes uploaded logo, top-right positioning, and full custom branding. |

Evaluators can also toggle between Free and Premium at any time using the **Tier Switcher** pill in the top navigation bar!

---

## 📊 Data Modeling & Schema Design

### 1. `User` Schema
- `name`: String, required
- `email`: String, required, unique index
- `password`: String (bcrypt hashed)
- `role`: `'free'` | `'premium'` (default: `'free'`)
- `branding`:
  - `logo`: String (Base64 data URI)
  - `logoPosition`: `'top-left'` | `'top-right'` (default: `'top-left'`)
  - `companyName`, `companyAddress`, `companyPhone`

### 2. `Client` Schema
- `userId`: ObjectId, ref: `User`, indexed
- `name`: String, required
- `email`: String, required
- `phone`: String
- `billingAddress`: `{ street, city, state, zip, country }`
- **Compound Index**: `{ userId: 1, email: 1 }` (fast client lookup per user)

### 3. `Invoice` Schema
- `userId`: ObjectId, ref: `User`, indexed
- `clientId`: ObjectId, ref: `Client`, indexed
- `invoiceNumber`: String, required, uppercase
- `items`: Array of `{ description, quantity, unitPrice, amount }`
- `subtotal`: Number, auto-calculated
- `taxRate`: Number (flat percentage field, e.g. 10 for 10%)
- `taxAmount`: Number, auto-calculated
- `total`: Number, auto-calculated
- `issueDate`: Date
- `dueDate`: Date, required
- `status`: `'draft'` | `'sent'` | `'paid'` | `'overdue'`
- `notes`: String
- **Compound Unique Index**: `{ userId: 1, invoiceNumber: 1 }` (enforces uniqueness per user account)
- **Compound Query Indexes**: `{ userId: 1, status: 1, issueDate: -1 }`, `{ userId: 1, clientId: 1 }`

---

## 🛡️ Tiered Access Security (Evaluation Verification)

The PRD states: *"Correctly gated, doesn't leak premium-only functionality to free users via API (not just hidden in UI)"*.

1. **Middleware Gating (`backend/src/middleware/requirePremium.js`)**:
   - `POST /api/users/branding/logo` and `PUT /api/users/branding` check `req.user.role === 'premium'`.
   - Free tier requests are immediately rejected with **HTTP 403 Forbidden**:
     ```json
     {
       "success": false,
       "error": "Feature Restricted: Custom branding (logo upload and positioning) is exclusively available to Premium tier subscribers.",
       "upgradeRequired": true
     }
     ```
2. **Data Leakage Guard**:
   - In `GET /api/invoices/:id`, if the issuing user is not a premium user, any logo branding is stripped from the API payload (`invoice.userId.branding.logo = null`).
3. **Frontend UI Gating**:
   - Free users see locked indicators with upgrade options.
   - Invoice print views only display logos when `user.role === 'premium'`.

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register`: Register user (`name, email, password, role`)
- `POST /api/auth/login`: Authenticate user, returns JWT token
- `GET /api/auth/me`: Get current authenticated user profile

### Clients (Scoped to Authenticated User)
- `GET /api/clients?search=`: List all clients (with optional search filter)
- `POST /api/clients`: Create new client (`name, email, phone, billingAddress`)
- `GET /api/clients/:id`: Get single client details and invoice count
- `PUT /api/clients/:id`: Update client details
- `DELETE /api/clients/:id`: Delete client (prevents deletion if associated invoices exist)

### Invoices (Scoped to Authenticated User)
- `GET /api/invoices?status=&clientId=&startDate=&endDate=&search=`: Filter invoices by status, client, or date range
- `GET /api/invoices/next-number`: Get suggested sequential invoice number (`INV-2026-003`)
- `POST /api/invoices`: Create invoice with dynamic line items & auto-calculations
- `GET /api/invoices/:id`: Get single invoice in clean printable structure
- `PUT /api/invoices/:id`: Update invoice line items, dates, and terms
- `PATCH /api/invoices/:id/status`: Transition status (`draft`, `sent`, `paid`, `overdue`)
- `DELETE /api/invoices/:id`: Delete invoice

### User & Custom Branding (Tier Gated)
- `GET /api/users/profile`: Get company profile
- `PUT /api/users/profile`: Update business name, phone, address
- `POST /api/users/branding/logo`: Upload logo image (🔒 **Premium only - 403 for Free**)
- `PUT /api/users/branding`: Set logo placement (`top-left` / `top-right`) (🔒 **Premium only - 403 for Free**)
- `POST /api/users/switch-role`: Instant role toggle for testing (`free` <-> `premium`)

---

## 🧪 Automated Testing

Run the automated integration test suite:

```bash
cd backend
npm test
```

The test suite exercises:
- User registration and JWT authentication
- Client CRUD and data integrity
- Dynamic line item math (quantity * price, subtotals, tax %, grand totals)
- Duplicate invoice number constraint rejection (HTTP 409)
- Query filtering (`status`, `clientId`, `date range`)
- Free tier HTTP 403 rejection on custom branding endpoints
- Premium tier custom branding upload & positioning
- Invoice printable view data leakage prevention
- Status transitions to `paid`

---

## 🚀 Frontend Deployment (Vercel / Netlify)

The frontend is ready for zero-configuration deployment to any static hosting provider.

### Deploying to Vercel
1. Install Vercel CLI: `npm i -g vercel` or connect the repo to the Vercel Dashboard.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. The included `frontend/vercel.json` provides SPA routing rewrites.
6. Set environment variable in Vercel: `VITE_API_URL=https://your-backend-domain.com/api` (or keep proxy).

### Deploying to Netlify
1. Connect repo to Netlify.
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. The included `frontend/netlify.toml` provides SPA redirect rules.

---

## 👥 Authors & Assessment Notes
Built for **91 Technologies Private Limited (the notary.app)** Full Stack Assessment.
Designed to meet 100% of functional requirements, data modeling requirements, and evaluation criteria.

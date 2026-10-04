# GPS Based Attendance & Tracking Application
## Adani Smart Meter Project — Enterprise Workforce Management Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-000000.svg?logo=vercel&logoColor=white)](https://vercel.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Design_System-Tailwind_CSS_3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Container-Docker_Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

A production-grade, enterprise workforce attendance and operational management platform engineered for the **Adani Energy Solutions Smart Meter Project**. Built with strict adherence to corporate design specifications, modern responsive layout guidelines, role-based security, geofenced GPS check-in/check-out, and unified deployment capabilities (Vercel, Docker, and Cloud Run).

---

## 📑 Table of Contents

- [Key Highlights & Architecture](#-key-highlights--architecture)
- [System Roles & Workflow](#-system-roles--workflow)
- [Application Screens & Route Mapping](#-application-screens--route-mapping)
- [Design System & Color Tokens](#-design-system--color-tokens)
- [Repository & File Structure](#-repository--file-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started Locally](#-getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup (FastAPI)](#1-backend-setup-fastapi)
  - [2. Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
  - [3. Running with Docker Compose](#3-running-with-docker-compose)
- [Deployment on Vercel (Fullstack Unified)](#-deployment-on-vercel-fullstack-unified)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [REST API Reference](#-rest-api-reference)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ⚡ Key Highlights & Architecture

- **Unified Fullstack Vercel Deployment:** The entire system (Vite frontend + FastAPI serverless backend) can be hosted on a single Vercel project with zero CORS issues and automated routing via [`vercel.json`](./vercel.json).
- **Dual-Mode Database Architecture:** Connects automatically to **MongoDB Atlas** in the cloud. If cloud credentials are not supplied or an IP is blocked, an embedded in-memory database engine activates instantly with zero configuration and seamless automatic Atlas synchronization in the background.
- **Enterprise Role-Based Access Control (RBAC):**
  - **Field Technicians:** Fast GPS-verified field check-in and check-out, shift timeline logs, assigned substation overview, and attendance trail. Privacy-first: no continuous background user location tracking.
  - **Operations Admins:** Fleet telemetry, interactive substation map, full employee roster management, site assignment, dynamic reports, and Excel (`.xlsx`) data export.
- **Geofence Proximity Engine:** Validates technician proximity to assigned substations (default radius: 500m) using mathematical Haversine calculations.
- **Enterprise Design System:** Built with Tailwind CSS, Adani brand colors (`#1E63F0`, `#22C55E`, `#EF4444`), Lucide icons, Leaflet interactive GIS mapping, and Recharts operational metrics.

---

## 👥 System Roles & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Adani Login Portal                              │
│                    (Role-based JWT Authentication)                          │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │       Field Technician        │     │       Operations Admin        │
        ├───────────────────────────────┤     ├───────────────────────────────┤
        │ • Today's Dashboard Overview  │     │ • Operations KPI Dashboard    │
        │ • GPS Field Check-In          │     │ • Fleet Telemetry & GIS Map   │
        │ • Shift Check-Out & Duration  │     │ • Employee Roster Management  │
        │ • Daily/Weekly Status Audit   │     │ • Substation / Site Directory │
        │ • Monthly Attendance History  │     │ • Attendance Logs & Audit     │
        │ • Assigned Substation Specs   │     │ • Report Generator & Excel (.xlsx)│
        │ • Privacy: On-demand GPS only │     │ • System Geofence Settings    │
        └───────────────────────────────┘     └───────────────────────────────┘
```

---

## 🖥️ Application Screens & Route Mapping

| # | Screen | Route | Role Access | Key Features & Implementation |
|---|---|---|---|---|
| **1** | **Login Portal** | `/login` | Public | Sunset transmission tower hero banner, Mobile/User ID input, Password input, `#1E63F0` primary action, quick demo role switchers. |
| **2** | **Technician Dashboard** | `/dashboard` | Technician | Technician greeting, designation, assignment chip, active shift status card, quick actions (Check In, Check Out, Attendance, Assigned Site), Substation Geofence map preview. |
| **3** | **Field Check-In** | `/check-in` | Technician | Circular pin badge, "Ready to Check In", live GPS coordinates capture, assigned substation geofence verification, one-tap check-in confirmation. |
| **4** | **Shift Check-Out** | `/check-out` | Technician | Red departure badge, "Ready to Check Out", live coordinate timestamping, shift duration calculation, check-out confirmation modal. |
| **5** | **Today's Status** | `/attendance` | Technician | Green status banner, check-in (`10:24 AM`), check-out (`06:15 PM`), working duration tally (`7h 51m`), coordinates audit table. |
| **6** | **Attendance History** | `/history` | Both | Segmented tab switcher (Daily, Weekly, Monthly), month selector (`< Current Month >`), responsive desktop data grid & mobile status cards with color-coded badges. |
| **7** | **Assigned Substation** | `/site` | Technician | Substation infrastructure photo, Pune - Phase 1, Hinjewadi address, 2.4 km distance pill, site code `ADN-PS-001`, manager Suresh Patil contact, "Get Directions" navigation. |
| **8** | **Admin Operations Hub** | `/admin` | Admin | 4 enterprise KPI metric cards (Total Staff, Present, Absent, Checked Out), Recent Attendance audit table, Recharts weekly attendance trend & status donut charts. |
| **9** | **Employee Management** | `/employees` | Admin | Search by name or employee ID, "+ Add Employee" modal, technician roster with avatars, roles, assigned sites, Active/Inactive status badges, Edit & Delete operations. |
| **10** | **Sites Management** | `/sites` | Admin | Substation cluster directory, geofence radius configurations (default: 500m), assigned engineer counts, latitude/longitude boundary management. |
| **11** | **Reports & Export** | `/reports` | Admin | Attendance & location reports, Date range pickers (From / To), site selector, live aggregation table, instant **Export to Excel (`.xlsx`)** download. |
| **12** | **Location Tracking** | `/tracking` | Admin | Real-time fleet force radar, technician search & active/offline filter, interactive Leaflet/Mappls map markers, geofence boundary rings, employee movement history logs. |
| **13** | **Admin Settings** | `/settings` | Admin | Geofence policy controls, default radius setting, database status inspector (Atlas vs Operational In-Memory), system parameters. |

---

## 🎨 Design System & Color Tokens

| Token | Hex Code | Visual Application |
|---|---|---|
| **Primary Brand Blue** | `#1E63F0` | Header navigation, active tabs, primary buttons, brand accents |
| **Success Emerald** | `#22C55E` / `#10B981` | Present status, check-in confirmation, live status badges |
| **Danger Rose** | `#EF4444` / `#F43F5E` | Absent status, check-out action, critical alerts |
| **Warning Amber** | `#F59E0B` | Late arrival, caution states, pending sync |
| **Neutral Slate** | `#64748B` / `#0F172A` | Typography, subtitles, borders (`#E2E8F0`), dark container surfaces |
| **Canvas Background** | `#F8FAFC` & `#FFFFFF` | Application shell, content panels, card backgrounds |
| **Typography** | `Inter` / `sans-serif` | Clean, modern typography across all screens (Weights: 400, 500, 600, 700, 800) |

---

## 📁 Repository & File Structure

```text
adani-smart-meter-project/
├── .env                              # Master environment variables template
├── .gitignore                        # Git exclusion rules (node_modules, .env, .vercel)
├── package.json                      # Root package orchestrator for Vercel build
├── vercel.json                       # Fullstack Vercel routing & serverless configuration
├── requirements.txt                  # Root Python requirements for Vercel detection
├── DEPLOYMENT_VERCEL.md              # Dedicated Vercel step-by-step deployment guide
├── DEPLOYMENT.md                     # Google Cloud Run & Docker deployment guide
├── docker-compose.yml                # Multi-container orchestration (Frontend + Backend)
│
├── api/                              # VERCEL SERVERLESS BACKEND
│   ├── index.py                      # Serverless Function entrypoint (FastAPI handler)
│   └── requirements.txt              # Serverless Python dependencies
│
├── backend/                          # FASTAPI BACKEND SERVICE
│   ├── Dockerfile                    # Python 3.11 slim production container image
│   ├── requirements.txt              # Backend Python dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app, lifespan, CORS & serverless middleware
│   │   ├── core/
│   │   │   ├── config.py             # App settings, Pydantic BaseSettings, environment defaults
│   │   │   └── security.py           # Passlib bcrypt hashing, JWT access token generation
│   │   ├── db/
│   │   │   ├── mongodb.py            # MongoDB Atlas connection manager + In-Memory replica
│   │   │   └── seed_data.py          # Realistic seed data (Employees, Sites, Attendance records)
│   │   ├── models/                   # Database document representations
│   │   ├── schemas/                  # Pydantic validation models (Auth, Attendance, Sites, etc.)
│   │   ├── routes/                   # API endpoint routers:
│   │   │   ├── auth.py               # Authentication & token verification
│   │   │   ├── attendance.py         # Check-in, check-out, history, today's status
│   │   │   ├── employees.py          # Staff CRUD and assignment
│   │   │   ├── sites.py              # Substation management
│   │   │   ├── locations.py          # Fleet telemetry and location history
│   │   │   ├── dashboard.py          # Analytics & KPI aggregations
│   │   │   ├── reports.py            # Filtered reports & Excel export
│   │   │   └── settings.py           # Admin operational parameters
│   │   ├── services/                 # Business logic and attendance processing
│   │   └── utils/
│   │       └── geo.py                # Haversine distance, proximity calculations
│
└── frontend/                         # REACT 19 + VITE FRONTEND SERVICE
    ├── package.json                  # Frontend scripts and dependencies
    ├── vite.config.js                # Vite build and dev server configuration
    ├── tailwind.config.js            # Adani enterprise color palette and typography
    ├── vercel.json                   # Standalone client-side SPA routing fallback
    ├── Dockerfile                    # Multi-stage container build (Vite build + Nginx)
    ├── nginx.conf                    # Nginx web server configuration with SPA routing
    ├── public/                       # Static public assets (icons, brand logos)
    └── src/
        ├── App.jsx                   # Root application entrypoint
        ├── main.jsx                  # React DOM initialization
        ├── index.css                 # Tailwind CSS directives & global animations
        ├── components/
        │   ├── layout/               # Navbar, Sidebar, BottomNav, MobileDrawer, AppLayout
        │   ├── ui/                   # Card, Button, Input, Modal, Toast, StatusBadge
        │   └── maps/                 # InteractiveMap (Leaflet GIS with pulse marker & rings)
        ├── context/                  # AuthContext (JWT handling, session caching, role switching)
        ├── hooks/                    # useAuth, useGeolocation, useLocationSync
        ├── pages/                    # 12 Application screens (Login, Dashboards, Reports, etc.)
        ├── routes/                   # AppRoutes with ProtectedRoute role guards
        ├── services/                 # Axios client (api.js), Auth API, Report API
        └── utils/                    # Geo distance calculations, date/time formatters
```

---

## 🛠️ Tech Stack

### Frontend Architecture
- **Framework:** React 19 with Vite 8 (ultra-fast build and HMR)
- **Routing:** React Router DOM v7 (protected routes, role guards, SPA history)
- **Styling:** Tailwind CSS 3.4 (custom corporate tokens, glassmorphism, responsive utilities)
- **Icons:** Lucide React (feather-style clean icon library)
- **GIS & Maps:** Leaflet 1.9 & React-Leaflet 5 (custom pulsating pin icons, geofence radius rings)
- **Charts:** Recharts 3 (interactive area trends, operational donut charts)
- **Excel Generation:** SheetJS (`xlsx`) for client/server spreadsheet processing
- **HTTP Client:** Axios with dynamic base URL and JWT authorization bearer interceptors

### Backend Architecture
- **Framework:** FastAPI 0.100+ (high performance asynchronous REST API)
- **Server:** Uvicorn ASGI server with hot reload
- **Validation:** Pydantic v2 & Pydantic-Settings
- **Security:** OAuth2 password flow, JWT (JSON Web Tokens) with `python-jose`, BCrypt password hashing via `passlib`
- **Database Driver:** Motor (async MongoDB driver) & PyMongo
- **Serverless Adapter:** Native Vercel Python ASGI integration + Mangum compatibility
- **Data Export:** Pandas & OpenPyXL for automated server-side report generation

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.10, v3.11, or v3.12
- **Git**

---

### 1. Backend Setup (FastAPI)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API:** `http://localhost:8000`
- **Interactive OpenAPI Documentation (Swagger):** `http://localhost:8000/docs`
- **Alternative Documentation (ReDoc):** `http://localhost:8000/redoc`

---

### 2. Frontend Setup (React + Vite)

Open a second terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Web Application:** `http://localhost:5173`

---

### 3. Running with Docker Compose

To start both the frontend and backend with a single command:

```bash
docker-compose up --build
```

- **Frontend Application:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

---

## 🚀 Deployment on Vercel (Fullstack Unified)

Both the frontend and backend are configured to deploy together seamlessly under **one single Vercel project**.

### Step 1: Push Code to Git
Ensure your latest changes are pushed to GitHub, GitLab, or Bitbucket.

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** > **"Project"**.
2. Select your repository and click **"Import"**.
3. **Important:** Keep **Root Directory** as `./` (do not set to `frontend` or `backend`).

### Step 3: Configure Environment Variables
Under the **Environment Variables** section in Vercel, configure:

| Variable | Recommended Value | Note |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/adani_smart_meter_db?retryWrites=true&w=majority` | Your Atlas connection string |
| `DATABASE_NAME` | `adani_smart_meter_db` | Target MongoDB database |
| `JWT_SECRET` | `adani-smart-meter-production-grade-jwt-secret-key-987654321` | Strong secret key |
| `DEFAULT_SITE_NAME` | `Pune - Phase 1` | Default site name |
| `DEFAULT_SITE_LAT` | `18.5204` | Site latitude |
| `DEFAULT_SITE_LNG` | `73.8567` | Site longitude |

> **MongoDB Atlas Network Rule:** In your MongoDB Atlas Dashboard, go to **Network Access** > click **Add IP Address** > select **"Allow Access From Anywhere"** (`0.0.0.0/0`) because Vercel uses dynamic serverless IP pools.

### Step 4: Click Deploy
Vercel will install npm dependencies, build the Vite frontend, package the Python Serverless Function, and generate your live URL (`https://your-project.vercel.app`).

> For full details, see the dedicated [DEPLOYMENT_VERCEL.md](file:///e:/comp-proj/DEPLOYMENT_VERCEL.md) guide.

---

## 🔑 Demo Credentials

The platform is pre-loaded with realistic sample accounts and seed data:

| Portal | Employee ID | Email | Password | Role Scope |
|---|---|---|---|---|
| **Operations Admin** | `ADMIN01` | `admin@adani.com` | `Admin@123` (or `adani123`) | Full admin access: employee directory, site management, fleet tracking, reports & Excel export |
| **Field Technician** | `EMP001` | `rahul.sharma@adani.com` | `Tech@123` (or `adani123`) | Technician access: dashboard, GPS check-in/out, today's status, history, assigned site |
| **Field Technician** | `EMP002` | `priya.verma@adani.com` | `Tech@123` (or `adani123`) | Field technician profile |

*Quick Switcher: The login screen and top navigation bar include instant demo role switchers for effortless demonstration and testing.*

---

## 📡 REST API Reference

All backend endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with Employee ID / Email and password, returns JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### Attendance & Field Operations
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/attendance/check-in` | Record GPS check-in with geofence proximity verification |
| `POST` | `/api/attendance/check-out` | Record GPS departure and compute total shift duration |
| `GET` | `/api/attendance/today` | Retrieve technician's active shift status and coordinates for today |
| `GET` | `/api/attendance/history` | Query attendance history with Daily, Weekly, or Monthly aggregation |

### Site & Employee Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sites` | List substations (supports filter by `employee_id`) |
| `POST` | `/api/sites` | Create a new substation site (Admin only) |
| `PUT` | `/api/sites/{site_id}` | Update substation parameters and geofence radius (Admin only) |
| `GET` | `/api/employees` | List all staff members with status and assigned substation |
| `POST` | `/api/employees` | Register a new technician (Admin only) |
| `PUT` | `/api/employees/{emp_id}` | Edit employee details or change substation assignment |
| `DELETE` | `/api/employees/{emp_id}` | Remove employee record (Admin only) |

### Fleet Telemetry & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/locations/team` | Live locations and statuses for all active staff (Admin only) |
| `GET` | `/api/locations/history/{employee_id}` | Movement breadcrumbs for a specific technician (Admin only) |
| `GET` | `/api/dashboard/stats` | KPI counters, weekly attendance trend data, and status breakdown |
| `GET` | `/api/reports/attendance` | Multi-filter attendance report (dates, site, employee) |
| `GET` | `/api/reports/export-excel` | Generates a downloadable `.xlsx` workbook |

### System Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and database connectivity indicator |
| `GET` | `/api` | API root service metadata |

---

## ❓ Troubleshooting & FAQs

#### 1. Why does MongoDB Atlas show "Connection attempt deferred"?
If your IP address has changed or is not yet whitelisted in MongoDB Atlas, the system automatically activates its built-in in-memory database so the application continues to run without crashing. In the background, it continuously retries connecting to Atlas and syncs data once access is granted.  
**Fix:** In MongoDB Atlas > **Network Access**, add `0.0.0.0/0` (Allow from anywhere) or your current public IP.

#### 2. Why does refreshing a route on Vercel return 404?
Single-page applications (React Router) require rewriting all non-asset requests to `/index.html`. Both [`vercel.json`](./vercel.json) and [`frontend/vercel.json`](./frontend/vercel.json) include the rewrite rule `{ "source": "/(.*)", "destination": "/index.html" }` to prevent this issue.

#### 3. How do GPS permissions work in local development?
Browsers allow Geolocation APIs on `localhost` and `https://` URLs. If running on a local network IP (e.g. `http://192.168.x.x`), modern browsers may block GPS requests unless accessed via HTTPS. On Vercel, HTTPS is provided automatically.

---

## 📄 License & Attribution

Designed and developed for the **Adani Energy Solutions Smart Meter Project**.  
All logos, brand names, and project assets are the property of their respective owners.

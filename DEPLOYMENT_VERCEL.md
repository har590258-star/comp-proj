# Vercel Fullstack Deployment Guide

This project is configured to deploy **both Frontend (React / Vite) and Backend (FastAPI Python)** on [Vercel](https://vercel.com) under a single project with zero-configuration routing.

---

## 🏗️ Architecture on Vercel

```
                                      ┌──────────────┐
                                      │    Vercel    │
                                      │ Edge Network │
                                      └──────┬───────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             Route: /api/(.*)                              Route: /(.*)
        ┌─────────────────────────┐                 ┌─────────────────────────┐
        │  Python Serverless Fn   │                 │   Static SPA Assets     │
        │      (api/index.py)     │                 │     (frontend/dist)     │
        │  FastAPI + MongoDB Atlas│                 │       React + Vite      │
        └─────────────────────────┘                 └─────────────────────────┘
```

- **Frontend:** Built via Vite into static assets served globally via Vercel CDN.
- **Backend:** Runs as a Python Serverless Function (`api/index.py`) routing all `/api/*` requests.
- **Client Routing:** React Router SPA fallback (`/(.*) -> /index.html`) is configured in both root and frontend `vercel.json`.

---

## 🚀 Option 1: Deploy via Vercel Web Dashboard (Recommended)

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure your latest changes are pushed to your Git repository:
```bash
git add .
git commit -m "Configure fullstack deployment for Vercel"
git push origin main
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Select your Git repository and click **"Import"**.

### Step 3: Configure Project Settings
- **Project Name:** `adani-smart-meter-project` (or your choice)
- **Framework Preset:** **Vite** (or leave as detected)
- **Root Directory:** `./` (leave default root, **do not change to `frontend` or `backend`**)
- **Build & Output Settings:** Already defined in `vercel.json` and root `package.json`:
  - Build Command: `cd frontend && npm install && npm run build`
  - Output Directory: `frontend/dist`

### Step 4: Add Environment Variables in Vercel
In the **Environment Variables** section of the Vercel project configuration, add:

| Variable Name | Example / Recommended Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.mongodb.net/adani_smart_meter_db?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `DATABASE_NAME` | `adani_smart_meter_db` | MongoDB Database Name |
| `JWT_SECRET` | `adani-smart-meter-production-grade-jwt-secret-key-987654321` | Secret key for JWT session tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token validity (7 days) |
| `DEFAULT_SITE_NAME` | `Pune - Phase 1` | Default operational site name |
| `DEFAULT_SITE_LAT` | `18.5204` | Default site latitude |
| `DEFAULT_SITE_LNG` | `73.8567` | Default site longitude |
| `DEFAULT_GEOFENCE_RADIUS_METERS` | `500` | Allowed attendance radius in meters |

> **MongoDB Atlas Network Access Note:**  
> Since Vercel Serverless Functions use dynamic IP addresses, make sure to whitelist all IPs in MongoDB Atlas:
> 1. Go to **MongoDB Atlas** > **Network Access**.
> 2. Click **"Add IP Address"** > select **"Allow Access From Anywhere"** (`0.0.0.0/0`).

### Step 5: Click "Deploy"
Vercel will install dependencies, build the Vite frontend, compile the Python API function, and deploy your site!

---

## 💻 Option 2: Deploy via Vercel CLI

If you prefer deploying directly from your terminal:

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

---

## 🧪 Post-Deployment Verification

Once deployed, your application will have a URL like `https://your-project.vercel.app`.

1. **Verify Backend Health:**
   Visit:
   ```text
   https://your-project.vercel.app/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "Adani Smart Meter Tracking API",
     "version": "1.0.0",
     "database": "Atlas"
   }
   ```

2. **Verify Interactive API Docs:**
   Visit:
   ```text
   https://your-project.vercel.app/docs
   ```

3. **Verify Frontend Application:**
   Visit `https://your-project.vercel.app` and log in with the pre-seeded credentials:
   - **Admin Portal:** `admin@adani.com` / `Admin@123` (or ID: `ADMIN01`)
   - **Technician Portal:** `rahul.sharma@adani.com` / `Tech@123` (or ID: `EMP001`)

---

## 📁 Key Files Added for Vercel Deployment

- [`vercel.json`](./vercel.json): Root configuration coordinating the Vite build, Python serverless function, and routing.
- [`api/index.py`](./api/index.py): Serverless function entrypoint exposing FastAPI to Vercel's serverless runtime.
- [`api/requirements.txt`](./api/requirements.txt): Python dependencies for the serverless function.
- [`package.json`](./package.json): Root build orchestration script for Vercel's build runner.
- [`frontend/vercel.json`](./frontend/vercel.json): Client-side SPA routing fallback for standalone frontend deployments.
- [`frontend/src/services/api.js`](./frontend/src/services/api.js): Dynamic API URL configuration supporting both local dev and unified production domain.

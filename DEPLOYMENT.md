# Deployment Guide: Google Cloud Run & MongoDB Atlas
## GPS Based Attendance & Tracking Application — Adani Smart Meter Project

This guide provides end-to-end instructions for deploying both the FastAPI backend and React frontend onto **Google Cloud (Cloud Run)** with **MongoDB Atlas** and **Mappls API**.

---

### Architectural Overview

```
                        [ Client Devices (Web/Mobile Browser) ]
                                         │
                                         ▼
                     [ Google Cloud Run (Frontend / Nginx) ]
                                         │
                                         ▼
                     [ Google Cloud Run (Backend / FastAPI) ]
                         │                      │
                         ▼                      ▼
               [ MongoDB Atlas Cluster ]    [ Mappls Maps API ]
```

---

### Prerequisites
1. **Google Cloud SDK (`gcloud`)** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project <YOUR_GCP_PROJECT_ID>
   ```
2. **Docker** installed and running.
3. **MongoDB Atlas Account** with an active M0/M10+ cluster.
4. **Mappls Developer Account** with an API key.

---

### Step 1: Configure MongoDB Atlas Network Access
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Network Access** > **Add IP Address**.
3. For Cloud Run stateless containers, allow access from anywhere (`0.0.0.0/0`) or configure Google Cloud VPC peering.
4. Go to **Database Access** and create an application user with read/write permissions on `adani_smart_meter_db`.
5. Under **Database Deployments**, click **Connect** > **Drivers** > **Python**, and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   ```

---

### Step 2: Configure Mappls API Key
1. Visit the [Mappls Developer Portal](https://about.mappls.com/api/).
2. Generate an API Key for Web & REST Services.
3. Store this key safely for your frontend (`VITE_MAPPLS_API_KEY`) and backend (`MAPPLS_API_KEY`).

---

### Step 3: Build & Deploy FastAPI Backend to Google Cloud Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and submit the container image to Google Artifact Registry / Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/<YOUR_GCP_PROJECT_ID>/adani-tracking-backend:latest
   ```

3. Deploy the backend service to Cloud Run:
   ```bash
   gcloud run deploy adani-tracking-backend \
     --image gcr.io/<YOUR_GCP_PROJECT_ID>/adani-tracking-backend:latest \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --port 8000 \
     --set-env-vars "PORT=8000" \
     --set-env-vars "MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority" \
     --set-env-vars "DATABASE_NAME=adani_smart_meter_db" \
     --set-env-vars "JWT_SECRET=adani-smart-meter-production-grade-jwt-secret-key-987654321" \
     --set-env-vars "MAPPLS_API_KEY=<YOUR_MAPPLS_API_KEY>" \
     --set-env-vars "FRONTEND_URL=*"
   ```

4. Note the output Service URL, e.g.:
   `https://adani-tracking-backend-xyz-el.a.run.app`

---

### Step 4: Build & Deploy React Frontend to Google Cloud Run

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Build and submit the frontend container image, passing the backend Cloud Run URL:
   ```bash
   gcloud builds submit \
     --tag gcr.io/<YOUR_GCP_PROJECT_ID>/adani-tracking-frontend:latest \
     --substitutions=_API_URL="https://adani-tracking-backend-xyz-el.a.run.app/api",_MAP_KEY="<YOUR_MAPPLS_API_KEY>"
   ```

3. Deploy the frontend service to Cloud Run:
   ```bash
   gcloud run deploy adani-tracking-frontend \
     --image gcr.io/<YOUR_GCP_PROJECT_ID>/adani-tracking-frontend:latest \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --port 80
   ```

4. Note the frontend Service URL, e.g.:
   `https://adani-tracking-frontend-xyz-el.a.run.app`

---

### Step 5: Connect Frontend to Backend (CORS & Domain)
Update the backend Cloud Run environment variables to restrict CORS to the newly deployed frontend URL:
```bash
gcloud run services update adani-tracking-backend \
  --region asia-south1 \
  --update-env-vars "FRONTEND_URL=https://adani-tracking-frontend-xyz-el.a.run.app"
```

---

### Step 6: Configure Custom Domain & Enable HTTPS
1. In the Google Cloud Console, navigate to **Cloud Run** > **Manage Custom Domains**.
2. Click **Add Mapping** and select the service (`adani-tracking-frontend`).
3. Enter your custom domain (e.g., `attendance.adanismartmeter.com`).
4. Update your DNS registrar with the provided DNS `CNAME` or `A`/`AAAA` records.
5. Google Cloud automatically provisions, manages, and renews a free **managed SSL/TLS certificate** for your domain (HTTPS enabled by default).

---

### Step 7: Local Development with Docker Compose
To run both containers locally:
```bash
docker-compose up --build
```
- Frontend will be accessible at: `http://localhost:3000`
- Backend REST API will be accessible at: `http://localhost:8000`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

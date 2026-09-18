# Backend Deployment Guide: Google Cloud Run

This guide documents the container packaging, configuration contract, and operational release procedures for the TrueFact News FastAPI backend on Google Cloud Run.

> **CRITICAL SECURITY WARNING:**
> Never paste actual secrets, passwords, connection strings, or private keys into terminal commands, shell history, log outputs, screenshots, source files, or documentation. All sensitive values (such as `DATABASE_URL`, `RAZORPAY_*`, and `GOOGLE_FACT_CHECK_API_KEY`) must be stored in Google Cloud Secret Manager and referenced securely via IAM role bindings.

---

## 1. Container Packaging & Build Architecture

### Build Context
The container image is built using `services/backend` as the build context. The backend is completely self-contained with no external repository workspace dependencies.

### Container Runtime Specification
- **Base Image:** Official pinned `python:3.11-slim-bookworm`.
- **System Dependencies:** Minimal runtime dependencies (`ca-certificates`, `curl`) with apt cache purged.
- **Python Flags:** `PYTHONDONTWRITEBYTECODE=1` and `PYTHONUNBUFFERED=1` to ensure synchronous logging and prevent bytecode pollution.
- **Security:** Executes as a non-root dedicated system user (`appuser`, UID/GID `10001`).
- **Port Binding:** Listens on `0.0.0.0:${PORT:-8080}` via exec-style shell process replacement (`exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}`).
- **Migrations:** Alembic migrations are **never** executed automatically on container startup to prevent race conditions during horizontal container autoscaling.

### Local Docker Build
Run from the repository root:
```bash
docker build -t truefact-backend:latest services/backend
```
Or run directly inside `services/backend`:
```bash
cd services/backend
docker build -t truefact-backend:latest .
```

### Local Container Run (Testing with Placeholders)
```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e APP_ENV=development \
  -e DEBUG=false \
  -e DOCS_ENABLED=true \
  -e DATABASE_URL="sqlite:///./test.db" \
  truefact-backend:latest
```

Verify local health:
```bash
curl -f http://localhost:8080/healthz
```

---

## 2. Environment Variable Configuration Contract

All settings are enforced by Pydantic in `app.core.config.Settings`. In `APP_ENV=production`, strict validation rules are evaluated at application boot.

### Required Production Environment Variables

| Variable | Type | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | String | `production` | Enables production mode and triggers security validations. |
| `DEBUG` | Boolean | `false` | **Must** be `false` in production. Boot will fail if `true`. |
| `DOCS_ENABLED` | Boolean | `false` | **Must** be `false` in production. Disables `/docs` and `/redoc`. |
| `ALLOWED_HOSTS` | CSV String | `api.example.com,truefact-backend-PROJECT_HASH-REGION.a.run.app` | Explicit hostnames allowed by `TrustedHostMiddleware`. Wildcards (`*`) are prohibited. |
| `CORS_ORIGINS` | CSV String | `https://example.com,https://app.example.com` | Comma-separated list of explicit HTTPS web/client origins. Wildcards (`*`) and HTTP schemes are prohibited. |
| `ENABLE_ADMIN_MUTATIONS` | Boolean | `false` | Mutation feature gate. Must be `false` in production. |
| `ENABLE_EDITORIAL_MUTATIONS` | Boolean | `false` | Mutation feature gate. Must be `false` in production. |
| `ENABLE_EDITORIAL_WORKSPACE` | Boolean | `false` | Workspace feature gate. Must be `false` in production. |
| `BILLING_ENABLED` | Boolean | `false` | Phase 2A guard: must be `false` in production. |
| `DATABASE_URL` | Secret (URI) | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` | Connection string to Neon PostgreSQL. Provided via Secret Manager. Automatically normalized to `postgresql+psycopg://`. |

### Authentication Variables (Clerk OIDC)

When `AUTH_ENABLED=true`:

| Variable | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `AUTH_ENABLED` | Boolean | Yes | Set to `true` to enforce Clerk token authentication and RBAC. |
| `CLERK_ISSUER` | String | Yes (when auth enabled) | Canonical Clerk issuer URL (e.g., `https://clerk.example.com` or `https://clerk.INSTANCE.accounts.dev`). |
| `CLERK_JWKS_URL` | String | Yes (when auth enabled) | Clerk JWKS public key endpoint (e.g., `https://clerk.example.com/.well-known/jwks.json`). |
| `CLERK_AUTHORIZED_PARTIES` | CSV String | Yes (when auth enabled) | Comma-separated list of trusted client origins (e.g., `https://example.com`). Must be explicit HTTPS; wildcards, queries, or paths are rejected. |
| `CLERK_AUDIENCE` | String | No | Optional audience claim verification. |
| `CLERK_JWKS_TIMEOUT_SECONDS` | Float | No (Default: `5.0`) | Connection timeout for fetching JWKS keys. |
| `CLERK_JWKS_CACHE_TTL_SECONDS` | Integer | No (Default: `3600`) | In-memory cache duration for validated JWKS keys. |

### Optional Integrations (Secret Manager)

| Variable | Source | Description |
| :--- | :--- | :--- |
| `GOOGLE_FACT_CHECK_API_KEY` | Secret Manager | Optional API key for Google Fact Check Tools integration. |

---

## 3. Cloud Run Service Deployment Workflow

### Prerequisites
1. Ensure Google Cloud CLI (`gcloud`) is authenticated:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
2. Enable required Google Cloud services:
   ```bash
   gcloud services enable run.googleapis.com \
       artifactregistry.googleapis.com \
       secretmanager.googleapis.com \
       cloudbuild.googleapis.com
   ```

### Step 1: Create Artifact Registry Repository (One-time)
```bash
gcloud artifacts repositories create truefact-docker-repo \
    --repository-format=docker \
    --location=YOUR_GCP_REGION \
    --description="TrueFact News Docker repository"
```

### Step 2: Configure Secrets in Secret Manager
Store the database connection string:
```bash
# Read database URL securely without echoing in bash history
gcloud secrets create backend-database-url --replication-policy="automatic"
echo -n "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require" | \
    gcloud secrets versions add backend-database-url --data-file=-
```

Grant the Cloud Run service account access to Secret Manager:
```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_GCP_PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding backend-database-url \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Step 3: Build and Push the Container Image
Use Google Cloud Build to build directly in the cloud:
```bash
gcloud builds submit services/backend \
    --tag YOUR_GCP_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/truefact-docker-repo/backend:v0.1.0
```

### Step 4: Deploy the Cloud Run Service
```bash
gcloud run deploy truefact-news-backend \
    --image=YOUR_GCP_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/truefact-docker-repo/backend:v0.1.0 \
    --region=YOUR_GCP_REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="APP_ENV=production,DEBUG=false,DOCS_ENABLED=false,ENABLE_ADMIN_MUTATIONS=false,ENABLE_EDITORIAL_MUTATIONS=false,ENABLE_EDITORIAL_WORKSPACE=false,BILLING_ENABLED=false,AUTH_ENABLED=true,CLERK_ISSUER=https://clerk.YOUR_DOMAIN.com,CLERK_JWKS_URL=https://clerk.YOUR_DOMAIN.com/.well-known/jwks.json,CLERK_AUTHORIZED_PARTIES=https://YOUR_DOMAIN.com,ALLOWED_HOSTS=api.YOUR_DOMAIN.com,CORS_ORIGINS=https://YOUR_DOMAIN.com" \
    --set-secrets="DATABASE_URL=backend-database-url:latest" \
    --min-instances=0 \
    --max-instances=10 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=30s
```

---

## 4. Health Verification & Probes

Cloud Run automatically probes the application on the container port.

- **Probe Endpoint:** `GET /healthz` (or `GET /health`)
- **Success Response:** HTTP `200 OK` with payload:
  ```json
  {
    "status": "healthy",
    "service": "TrueFact News API"
  }
```

Verify the live Cloud Run deployment:
```bash
SERVICE_URL=$(gcloud run services describe truefact-news-backend --region=YOUR_GCP_REGION --format='value(status.url)')
curl -i -f "${SERVICE_URL}/healthz"
```

---

## 5. Controlled Database Migrations (Separate Release Step)

> **IMPORTANT:** Never run `alembic upgrade head` in the container startup command or entrypoint.

Migrations must be executed as a distinct, deliberate step prior to or during a scheduled maintenance window.

### Current Migration State
The production Neon database is currently at Alembic head:
```
39144c488d32 (add_user_productivity_tables)
```

### Migration Procedure for Future Releases
1. **Inspect Current and Target Revision:**
   Always inspect the current revision on the database versus the migration scripts in `services/backend/alembic/versions`:
   ```bash
   cd services/backend
   # Inspect current revision applied to target database
   poetry run alembic current
   # Inspect target head revision
   poetry run alembic heads
   ```

2. **Execute Migrations via Cloud Run Job or Controlled Admin Runner:**
   Create a dedicated Cloud Run Job using the identical container image:
   ```bash
   gcloud run jobs create backend-migrate \
       --image=YOUR_GCP_REGION-docker.pkg.dev/YOUR_GCP_PROJECT_ID/truefact-docker-repo/backend:v0.1.0 \
       --region=YOUR_GCP_REGION \
       --set-secrets="DATABASE_URL=backend-database-url:latest" \
       --command="alembic" \
       --args="upgrade,head"
   ```

   Execute the migration job:
   ```bash
   gcloud run jobs execute backend-migrate --region=YOUR_GCP_REGION --wait
   ```

3. **Verify Migration Status:**
   Confirm the database has reached the target head:
   ```bash
   gcloud run jobs execute backend-migrate --region=YOUR_GCP_REGION --args="current" --wait
   ```

---

## 6. Rollback Procedure

If a deployed revision exhibits regressions or fails health checks:

1. **Immediate Traffic Reversion:**
   Cloud Run retains previous immutable revisions. Instantly route 100% of traffic back to the known healthy revision:
   ```bash
   # List recent revisions
   gcloud run revisions list --service=truefact-news-backend --region=YOUR_GCP_REGION

   # Route traffic to the previous known good revision
   gcloud run services update-traffic truefact-news-backend \
       --region=YOUR_GCP_REGION \
       --to-revisions=PREVIOUS_HEALTHY_REVISION_NAME=100
   ```

2. **Database Rollback (if required):**
   If a migration was applied that is backward-incompatible, execute a downgrade step via the migration job:
   ```bash
   gcloud run jobs execute backend-migrate \
       --region=YOUR_GCP_REGION \
       --args="downgrade,TARGET_REVISION_ID" \
       --wait
   ```

3. **Verify Restored Traffic:**
   ```bash
   curl -i -f "${SERVICE_URL}/healthz"
   ```

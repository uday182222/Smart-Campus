# Deploy Smart Campus API to Railway

## Steps

1. **Push code to GitHub**  
   Ensure your repo is on GitHub and Railway can access it.

2. **Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub**  
   Connect your GitHub account and select the Smart Campus repository.  
   Set the **root directory** to `server` (or deploy the whole repo and set build root to `server` in Railway settings).

3. **Add PostgreSQL**  
   In your Railway project: **Add Plugin** → **PostgreSQL**.  
   Copy the `DATABASE_URL` from the PostgreSQL service variables and add it to your API service’s environment variables.

4. **Add Redis**  
   **Add Plugin** → **Redis**.  
   Copy `REDIS_HOST` and `REDIS_PORT` (and password if set) into your API service’s environment variables.

5. **Add all env vars from `.env.production.example`**  
   In your API service → **Variables**, add every variable from `server/.env.production.example` and set real values:
   - `NODE_ENV=production`
   - `PORT=5000` (or the port Railway assigns)
   - `DATABASE_URL` — from PostgreSQL plugin
   - `REDIS_HOST`, `REDIS_PORT` — from Redis plugin
   - `JWT_SECRET` — long random string (min 32 characters)
   - AWS and CORS values as needed

6. **After first deploy, run migrations**  
   In Railway, open your API service → **Settings** → run a one-off command, or use Railway CLI:
   ```bash
   npx prisma migrate deploy
   ```
   (Run this from the `server` directory or set root to `server`.)

7. **Run seed (optional)**  
   To create demo users:
   ```bash
   npx ts-node scripts/create-demo-users.ts
   ```
   (Ensure `DATABASE_URL` is set when running this.)

8. **Copy the Railway URL**  
   In your API service, open **Settings** → **Domains** (or **Networking**).  
   Copy the public URL (e.g. `https://smart-campus-api.railway.app`).  
   Use this as `EXPO_PUBLIC_API_URL` in the mobile app (e.g. `https://smart-campus-api.railway.app/api/v1` if your API is under `/api/v1`).

## Health check

Railway is configured to use `/health` as the healthcheck path. The server exposes this route at the root (e.g. `https://your-app.railway.app/health`).

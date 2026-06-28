# 🚀 Deploy URLHub on Render

## How it works
Build: `frontend/ → npm run build → dist/ → copied to backend/public/`
Runtime: `https://your-app.onrender.com/api/*` → API | `/*` → React SPA | `/:id` → redirect

---

## Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/urlhub.git
git push -u origin main
```

## Step 2 — MongoDB Atlas
1. mongodb.com/atlas → free M0 cluster
2. DB User: create with password
3. Network: Allow 0.0.0.0/0
4. Connect → Drivers → copy connection string → add `/urlhub` before `?`

## Step 3 — Deploy on Render
1. render.com → New → Web Service → connect repo
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm run render-build`
   - Start Command: `node app.js`
3. Environment Variables:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| PORT | 3000 |
| MONGO_URL | *(your Atlas URI)* |
| JWT_SECRET | *(any random 32+ char string)* |
| APP_URL | `https://urlhub.onrender.com/` ← with trailing slash! |

4. Create Web Service → wait ~5 min

## Step 4 — Verify
- `https://your-app.onrender.com/health` → `{"status":"OK"}`
- `https://your-app.onrender.com` → URLHub app

## Local Dev
```bash
# Backend
cd backend && cp .env.example .env  # fill in values
npm install && npm run dev

# Frontend  
cd frontend && npm install
npm run dev  # uses http://localhost:3000/api automatically
```

## Update
```bash
git add . && git commit -m "update" && git push
# Render auto-redeploys
```

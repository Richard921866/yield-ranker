# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest for Full Stack)

Railway can deploy both frontend and backend together.

**Steps:**
1. Push code to GitHub
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-detect:
   - Frontend: Vite app
   - Backend: Node.js server

**Backend Setup:**
- Root: `yield-ranker/server`
- Build Command: (none needed, runs directly)
- Start Command: `node index.js` or `bun index.js`
- Port: Railway auto-assigns, use `process.env.PORT`

**Frontend Setup:**
- Root: `yield-ranker`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL=https://your-backend.railway.app`

**Cost:** Free tier available, then ~$5-20/month

---

### Option 2: Vercel (Frontend) + Railway/Render (Backend)

**Frontend on Vercel:**
1. Push to GitHub
2. Go to https://vercel.com
3. Import your GitHub repo
4. Root Directory: `yield-ranker`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variable: `VITE_API_URL=https://your-backend-url.com`

**Backend on Railway/Render:**
- Same as Option 1 backend setup
- Update `vite.config.ts` to use production API URL

**Cost:** Vercel free, backend ~$5-20/month

---

### Option 3: Render (Full Stack)

**Steps:**
1. Push to GitHub
2. Go to https://render.com
3. Create two services:

**Backend Service:**
- Type: Web Service
- Root Directory: `yield-ranker/server`
- Build Command: (none)
- Start Command: `node index.js`
- Environment: Node.js

**Frontend Service:**
- Type: Static Site
- Root Directory: `yield-ranker`
- Build Command: `npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`

**Cost:** Free tier (spins down after inactivity), then ~$7/month per service

---

## Required Code Changes

### 1. Update Backend to Use Environment Port

The server already uses `process.env.PORT || 4000`, which is good for Railway/Render.

### 2. Update Frontend API URL

Create `.env.production`:
```
VITE_API_URL=https://your-backend-url.com
```

Update `vite.config.ts` to use env var in production.

### 3. Update CORS (if needed)

Backend already has `app.use(cors())` which should work, but you may need to restrict origins in production.

---

## Quick Start (Railway - Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy Backend:**
   - Go to Railway.app
   - New Project → GitHub
   - Select repo
   - Add service → Select `yield-ranker/server` folder
   - Set start command: `node index.js`
   - Railway will give you a URL like `https://your-app.railway.app`

3. **Deploy Frontend:**
   - Add another service in same Railway project
   - Select `yield-ranker` folder
   - Build command: `npm run build`
   - Start command: `npx serve -s dist -l 3000`
   - Environment variable: `VITE_API_URL=https://your-backend.railway.app`

4. **Share the frontend URL with your CEO!**

---

## Environment Variables Needed

**Backend:**
- `PORT` (auto-set by Railway/Render)
- `YAHOO_SERVER_PORT` (optional, defaults to 4000)

**Frontend:**
- `VITE_API_URL` (your backend URL)

---

## Testing Locally Before Deploy

1. Set environment variable:
```bash
# Windows PowerShell
$env:VITE_API_URL="http://localhost:4000"

# Or create .env.local
VITE_API_URL=http://localhost:4000
```

2. Build frontend:
```bash
npm run build
```

3. Test production build:
```bash
npm run preview
```


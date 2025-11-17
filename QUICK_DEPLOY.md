# Quick Deploy Guide - Get Your App Live in 10 Minutes

## Option 1: Railway (Easiest - Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Click **"Add Service"** → **"GitHub Repo"**
6. Select your repo again
7. In settings:
   - **Root Directory:** `yield-ranker/server`
   - **Start Command:** `node index.js`
   - Railway will auto-detect Node.js
8. Click **"Deploy"**
9. Once deployed, copy the URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend
1. In the same Railway project, click **"Add Service"** → **"GitHub Repo"**
2. Select your repo again
3. In settings:
   - **Root Directory:** `yield-ranker`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s dist -l $PORT`
   - **Output Directory:** `dist`
4. Go to **"Variables"** tab
5. Add environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (from Step 2)
6. Click **"Deploy"**

### Step 4: Get Your URL
- Railway will give you a frontend URL like `https://your-frontend.railway.app`
- Share this URL with your CEO!

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Backend (Railway)
Follow Step 2 from Option 1 above.

### Frontend (Vercel)
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `yield-ranker`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app`
7. Click **"Deploy"**

---

## Environment Variables Summary

**Backend (Railway):**
- `PORT` - Auto-set by Railway (don't add manually)

**Frontend (Railway/Vercel):**
- `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.railway.app`)

---

## Testing After Deploy

1. Visit your frontend URL
2. Open browser console (F12)
3. Check for any CORS or API errors
4. If you see errors, verify:
   - `VITE_API_URL` is set correctly
   - Backend is running (visit backend URL + `/api/health`)
   - CORS is enabled (already done in your code)

---

## Troubleshooting

**Frontend can't reach backend:**
- Check `VITE_API_URL` environment variable
- Make sure backend URL doesn't have trailing slash
- Verify backend is running (check Railway logs)

**CORS errors:**
- Backend already has `app.use(cors())` which should work
- If issues persist, you may need to restrict origins in production

**Build fails:**
- Check Railway/Vercel logs
- Make sure all dependencies are in `package.json`
- Verify Node.js version (Railway auto-detects)

---

## Cost Estimate

- **Railway:** Free tier (500 hours/month), then ~$5-20/month
- **Vercel:** Free tier (unlimited for personal projects)
- **Total:** Free to start, ~$5-20/month when scaling

---

## Next Steps

Once deployed:
1. Test all features
2. Set up custom domain (optional)
3. Enable monitoring/logging
4. Set up backups for `etfs.json` data


# EL ATLAS Backend — Render.com Deployment Guide

## 🚀 Render pe Deploy Kaise Karein

### Step 1: GitHub pe Push Karo
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/el-atlas-backend.git
git push -u origin main
```

### Step 2: Render.com pe Service Banao
1. [render.com](https://render.com) pe jaao aur login karo
2. **New +** → **Web Service** click karo
3. Apna GitHub repo connect karo
4. Ye settings use karo:
   - **Name:** `el-atlas-backend`
   - **Region:** Singapore (India ke liye closest)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Step 3: Environment Variables Set Karo
Render Dashboard → Environment mein ye sab add karo:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | (koi bhi random string) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary se |
| `CLOUDINARY_API_KEY` | Cloudinary se |
| `CLOUDINARY_API_SECRET` | Cloudinary se |
| `FRONTEND_URL` | Apni website ka URL |
| `DASHBOARD_URL` | Dashboard ka URL |
| `ADMIN_EMAIL` | `alishafaq782@gmail.com` |

### Step 4: Deploy!
Save karte hi Render automatically deploy karega.

## ⚠️ Free Plan Limitations
- Server **15 min inactivity** ke baad sleep hota hai
- Pehli request slow lagegi (cold start ~30 sec)
- Isko fix karne ke liye UptimeRobot se har 10 min ping karo:
  `https://YOUR-APP.onrender.com/api/health`

## ✅ Backend URL
Deploy hone ke baad aapka URL hoga:
`https://el-atlas-backend.onrender.com`

Dashboard aur frontend mein yahi URL set karo.

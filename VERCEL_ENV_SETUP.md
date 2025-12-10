# Quick Setup: Vercel Environment Variables

## Copy These Values to Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Click **"Add New"** for each variable below:

---

### Variable 1: MONGO_URI
**Key:** `MONGO_URI`  
**Value:** `mongodb+srv://kiruthuyakiruthu_db_user:kiruthu1025@salon-app.tvzddaq.mongodb.net/blendzhub?appName=salon-app`  
**Environments:** All (Production, Preview, Development)

---

### Variable 2: JWT_SECRET
**Key:** `JWT_SECRET`  
**Value:** `da348832ff4e6968b463c980d392a608`  
**Environments:** All (Production, Preview, Development)

---

### Variable 3: JWT_EXPIRE
**Key:** `JWT_EXPIRE`  
**Value:** `30d`  
**Environments:** All (Production, Preview, Development)

---

### Variable 4: CLOUDINARY_CLOUD_NAME
**Key:** `CLOUDINARY_CLOUD_NAME`  
**Value:** `dzu243cya`  
**Environments:** All (Production, Preview, Development)

---

### Variable 5: CLOUDINARY_API_KEY
**Key:** `CLOUDINARY_API_KEY`  
**Value:** `316365289814137`  
**Environments:** All (Production, Preview, Development)

---

### Variable 6: CLOUDINARY_API_SECRET
**Key:** `CLOUDINARY_API_SECRET`  
**Value:** `Q_u9h-LbO3jV8YQMZxtdtK_jZQs`  
**Environments:** All (Production, Preview, Development)

---

### Variable 7: CLOUDINARY_UPLOAD_PRESET
**Key:** `CLOUDINARY_UPLOAD_PRESET`  
**Value:** `blendzhub`  
**Environments:** All (Production, Preview, Development)

---

### Variable 8: NODE_ENV
**Key:** `NODE_ENV`  
**Value:** `production`  
**Environments:** Production only

---

## After Adding All Variables

1. ✅ Click **"Save"** for each variable
2. ✅ Go to **Deployments** tab
3. ✅ Click **"..."** next to latest deployment
4. ✅ Click **"Redeploy"**
5. ✅ Wait for deployment to complete

## Verify Setup

Visit: `https://your-vercel-url.vercel.app/api/debug/env`

Should show:
```json
{
  "hasJwtSecret": true,
  "hasMongoUri": true,
  "nodeEnv": "production"
}
```

Then test: `https://your-vercel-url.vercel.app/api/salons`

Should return salon data (not empty array)!

---

**⚠️ IMPORTANT:** Make sure to copy the values EXACTLY as shown, including the database name `/blendzhub` in the MONGO_URI.

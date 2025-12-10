# Vercel Deployment Guide - BlendzHub API

This guide will help you configure your Vercel deployment to connect to the correct MongoDB database.

## Problem

The Vercel-deployed backend returns empty arrays because environment variables are not configured in the Vercel dashboard. Vercel does **not** automatically read your local `.env` file - you must manually configure all environment variables.

## Solution: Configure Environment Variables in Vercel

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **BlendzHub API** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Required Environment Variables

Add the following environment variables **exactly as they appear in your local `.env` file**:

#### Required Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `MONGO_URI` | `mongodb+srv://kiruthuyakiruthu_db_user:kiruthu1025@salon-app.tvzddaq.mongodb.net/blendzhub?appName=salon-app` | MongoDB connection string |
| `JWT_SECRET` | `da348832ff4e6968b463c980d392a608` | JWT secret key |
| `JWT_EXPIRE` | `30d` | JWT expiration time |
| `CLOUDINARY_CLOUD_NAME` | `dzu243cya` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `316365289814137` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `Q_u9h-LbO3jV8YQMZxtdtK_jZQs` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | `blendzhub` | Cloudinary upload preset |
| `NODE_ENV` | `production` | Environment mode |

#### How to Add Each Variable

For each variable:

1. Click **Add New** button
2. Enter the **Key** (variable name, e.g., `MONGO_URI`)
3. Enter the **Value** (the actual value from your `.env` file)
4. Select **All** environments (Production, Preview, Development)
5. Click **Save**

> **⚠️ IMPORTANT**: Make sure to copy the `MONGO_URI` value **exactly** including the database name `blendzhub` in the connection string.

### Step 3: Redeploy Your Application

After adding all environment variables:

1. Go to **Deployments** tab
2. Click on the **three dots (...)** next to the latest deployment
3. Click **Redeploy**
4. Wait for the deployment to complete

## Verification Steps

### 1. Check Environment Variables Endpoint

Visit your Vercel API URL:
```
https://your-vercel-url.vercel.app/api/debug/env
```

Expected response:
```json
{
  "hasJwtSecret": true,
  "jwtSecretLength": 32,
  "hasMongoUri": true,
  "nodeEnv": "production",
  "message": "JWT_SECRET is set (length: 32)"
}
```

If `hasMongoUri` is `false`, the `MONGO_URI` variable is not set correctly.

### 2. Check Vercel Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click on **Logs** or **Runtime Logs**
4. Look for database connection logs:

Expected logs:
```
🔄 Establishing new database connection...
🔗 Connecting to: mongodb+srv://kiruthuyakiruthu_db_user:****@salon-app.tvzddaq.mongodb.net/blendzhub?appName=salon-app
✅ DB Connected Successfully!
🏠 Host: salon-app-shard-00-02.tvzddaq.mongodb.net
📊 Database: blendzhub
🔌 Connection State: 1
```

**Key things to verify:**
- ✅ Database name should be `blendzhub`
- ✅ Connection state should be `1` (connected)
- ❌ If you see "MONGO_URI environment variable is not set!", the variable is missing

### 3. Test Salons API Endpoint

Visit your salons endpoint:
```
https://your-vercel-url.vercel.app/api/salons
```

Expected response (should NOT be empty):
```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "...",
      "name": "Salon Name",
      "location": "Location",
      "type": "unisex",
      ...
    }
  ]
}
```

Check the logs for this request:
```
🔍 getAllSalons called
📝 Query params: {}
👤 User: Not authenticated
🔎 Applied filter: {}
📊 Sort: { createdAt: -1 }
🔌 DB Connection State: 1
📊 DB Name: blendzhub
📁 Collection: salons
📈 Total salons matching filter: 5
✅ Found 5 salons for current page
```

## Troubleshooting

### Issue: Empty Array Response

**Symptoms:**
- API returns `{ "data": [], "total": 0 }`
- Logs show: `📈 Total salons matching filter: 0`

**Possible Causes:**

1. **Wrong Database Name**
   - Check logs for: `📊 DB Name: ???`
   - Should be `blendzhub`, not something else
   - **Fix**: Verify `MONGO_URI` includes `/blendzhub` before the `?` parameter

2. **Connected to Different/Empty Database**
   - The connection string might be pointing to a different cluster or database
   - **Fix**: Copy the exact `MONGO_URI` from your local `.env` file

3. **Environment Variables Not Loaded**
   - Check `/api/debug/env` endpoint
   - **Fix**: Add all variables in Vercel dashboard and redeploy

### Issue: Database Connection Failed

**Symptoms:**
- API returns 500 error
- Logs show: `❌ DB Connection Error`

**Possible Causes:**

1. **MONGO_URI Not Set**
   - Logs show: "MONGO_URI environment variable is not set!"
   - **Fix**: Add `MONGO_URI` in Vercel environment variables

2. **Invalid Connection String**
   - Check for typos in the connection string
   - **Fix**: Copy the exact value from your local `.env`

3. **MongoDB Network Access**
   - MongoDB Atlas might be blocking Vercel's IP addresses
   - **Fix**: In MongoDB Atlas → Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)

### Issue: Authentication Errors

**Symptoms:**
- JWT errors in logs
- Users can't authenticate

**Possible Causes:**

1. **JWT_SECRET Not Set**
   - **Fix**: Add `JWT_SECRET` in Vercel environment variables

2. **Different JWT_SECRET in Production**
   - Tokens generated locally won't work in production
   - **Fix**: Use the same `JWT_SECRET` value as local

## Security Recommendations

> **⚠️ SECURITY WARNING**: Your MongoDB credentials are currently exposed in this document. After successful deployment, consider:

1. **Rotate MongoDB Password**
   - Go to MongoDB Atlas → Database Access
   - Edit user and change password
   - Update `MONGO_URI` in Vercel and local `.env`

2. **Rotate JWT Secret**
   - Generate a new random secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Update in Vercel and local `.env`
   - Note: This will invalidate all existing user sessions

3. **Restrict MongoDB Network Access**
   - Instead of allowing all IPs (0.0.0.0/0)
   - Add specific Vercel IP ranges if possible
   - Or use MongoDB's "Allow access from anywhere" with strong passwords

## Quick Reference Commands

### Test Local API
```bash
cd "BlendzHub-api "
npm run dev
curl http://localhost:5000/api/salons
```

### Test Vercel API
```bash
# Replace with your actual Vercel URL
curl https://your-vercel-url.vercel.app/api/salons
curl https://your-vercel-url.vercel.app/api/debug/env
```

### Check Vercel Logs
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# View logs
vercel logs
```

## Summary Checklist

- [ ] Added all 8 environment variables in Vercel dashboard
- [ ] Verified `MONGO_URI` includes `/blendzhub` database name
- [ ] Selected "All" environments when adding variables
- [ ] Redeployed the application after adding variables
- [ ] Checked `/api/debug/env` shows all variables are set
- [ ] Checked Vercel logs show successful database connection
- [ ] Verified database name in logs is `blendzhub`
- [ ] Tested `/api/salons` endpoint returns data (not empty array)
- [ ] Tested frontend with Vercel backend URL
- [ ] Considered rotating MongoDB password for security

---

**Need Help?**

If you're still experiencing issues after following this guide:

1. Check the Vercel Runtime Logs for detailed error messages
2. Verify the database name in the logs matches `blendzhub`
3. Ensure MongoDB Atlas allows connections from Vercel (Network Access settings)
4. Double-check all environment variable values match your local `.env` file exactly

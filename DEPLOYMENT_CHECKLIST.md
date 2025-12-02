# Vercel Deployment Checklist

## Current Status: FUNCTION_INVOCATION_FAILED Error

Follow these steps **in order** to fix the deployment:

## Step 1: Commit and Push Changes ✅

The code fixes are ready. Now commit and push:

```bash
cd "/home/uki-technology-school/Desktop/CODE/Final-project - V2/BlendzHub-api "

# Check what changed
git status

# Add the changes
git add app.js config/db.js

# Commit
git commit -m "Fix Vercel serverless deployment - add export and remove process.exit"

# Push to trigger Vercel deployment
git push
```

## Step 2: Check Vercel Build Logs 🔍

1. Go to https://vercel.com/dashboard
2. Click your API project
3. Go to **Deployments** tab
4. Click on the **latest deployment** (should show "Building..." or "Ready")
5. Look for errors in **Build Logs**

**Common build errors:**
- Missing dependencies
- Syntax errors
- Import/export issues

## Step 3: Set Environment Variables ⚙️

Go to **Settings** → **Environment Variables** and add:

### Required Variables:

| Variable | How to Get Value | Environments |
|----------|------------------|--------------|
| `MONGO_URI` | From MongoDB Atlas → Connect → Connect your application | All (Production, Preview, Development) |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | All |
| `NODE_ENV` | Set to: `production` | Production only |

**IMPORTANT:** After adding variables, you MUST redeploy!

## Step 4: Redeploy 🚀

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for completion

## Step 5: Check Function Logs 📋

After redeployment:

1. Go to **Deployments** → Click latest deployment
2. Click **Function Logs** tab
3. Look for errors

**Common runtime errors:**
- `Database connection failed` → Check MONGO_URI
- `secretOrPrivateKey must have a value` → Check JWT_SECRET
- `Cannot find module` → Missing dependency

## Step 6: Test the Deployment ✅

```bash
# Test debug endpoint
curl https://your-api.vercel.app/api/debug/env

# Expected response:
{
  "hasJwtSecret": true,
  "jwtSecretLength": 64,
  "hasMongoUri": true,
  "nodeEnv": "production"
}
```

## Quick Diagnosis

### If you see "FUNCTION_INVOCATION_FAILED":

**Check this first:**
```bash
# Did you push the changes?
cd "/home/uki-technology-school/Desktop/CODE/Final-project - V2/BlendzHub-api "
git log -1 --oneline
# Should show your recent commit
```

**Then check Vercel logs:**
- Build Logs → Look for build errors
- Function Logs → Look for runtime errors

### Common Causes:

1. **Code not pushed** → Run `git push`
2. **Missing MONGO_URI** → Add in Vercel dashboard
3. **Missing JWT_SECRET** → Add in Vercel dashboard  
4. **MongoDB network access** → Allow 0.0.0.0/0 in Atlas
5. **Wrong MongoDB connection string** → Check format: `mongodb+srv://...`

## MongoDB Atlas Network Access

If database connection fails:

1. Go to MongoDB Atlas
2. Click **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (0.0.0.0/0)
5. Click **Confirm**

## Need More Help?

Share the following:
1. Output of: `curl https://your-api.vercel.app/api/debug/env`
2. Screenshot of Vercel Function Logs
3. Screenshot of Vercel Environment Variables (hide values)

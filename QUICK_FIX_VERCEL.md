# Quick Fix: JWT_SECRET Error on Vercel

## The Problem
You added `JWT_SECRET` to your `.env` file, but Vercel doesn't use `.env` files. You need to add it in the Vercel Dashboard.

## Quick Solution (5 minutes)

### Step 1: Generate Secret Key
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output (long random string)

### Step 2: Add to Vercel Dashboard
1. Go to: **https://vercel.com/dashboard**
2. Click your project: **blendz-hub-api**
3. Click **Settings** tab
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Key**: `JWT_SECRET`
   - **Value**: (paste the secret you generated)
   - **Environments**: ☑️ Production ☑️ Preview ☑️ Development
7. Click **Save**

### Step 3: Redeploy (IMPORTANT!)
1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment

### Step 4: Test
Try login again in Postman - it should work now!

## Visual Guide
```
Vercel Dashboard
  └── Your Project (blendz-hub-api)
      └── Settings Tab
          └── Environment Variables
              └── Add New
                  └── Key: JWT_SECRET
                      Value: [your-secret]
                      Environments: All
                      └── Save
                          └── Deployments Tab
                              └── Redeploy
```

## Common Mistakes
- ❌ Adding to `.env` file only (doesn't work on Vercel)
- ❌ Forgetting to redeploy after adding variable
- ❌ Not selecting all environments
- ❌ Typo in variable name (must be exactly `JWT_SECRET`)

## Still Not Working?
1. Double-check variable name is exactly `JWT_SECRET` (case-sensitive)
2. Make sure you redeployed after adding the variable
3. Check deployment logs for errors
4. Verify the variable appears in Vercel Dashboard → Settings → Environment Variables


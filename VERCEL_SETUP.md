# Vercel Deployment Setup Guide

## ⚠️ IMPORTANT: Vercel Does NOT Use .env Files

**Vercel does NOT read `.env` files from your repository.** You must add environment variables directly in the Vercel Dashboard.

- ❌ Adding to `.env` file = Only works locally
- ✅ Adding in Vercel Dashboard = Works in production

## Required Environment Variables

Your Vercel deployment requires the following environment variables to be set **in the Vercel Dashboard**:

### 1. JWT_SECRET (Required)
- **Purpose**: Secret key for signing and verifying JWT tokens
- **How to set in Vercel**:
  1. Go to your Vercel project dashboard
  2. Navigate to **Settings** → **Environment Variables**
  3. Click **Add New**
  4. Name: `JWT_SECRET`
  5. Value: Generate a secure random string (at least 32 characters)
  6. Select all environments (Production, Preview, Development)
  7. Click **Save**

**Generate a secure JWT_SECRET:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example value:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 2. JWT_EXPIRE (Optional)
- **Purpose**: Token expiration time
- **Default**: `30d` (30 days)
- **Example values**: `1h`, `7d`, `30d`, `90d`

### 3. MONGO_URI (Required)
- **Purpose**: MongoDB connection string
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 4. PORT (Optional)
- **Purpose**: Server port (Vercel usually handles this automatically)
- **Default**: Usually not needed for Vercel serverless functions

## Steps to Fix "secretOrPrivateKey must have a value" Error

### Why This Error Happens
- You added `JWT_SECRET` to your local `.env` file
- Vercel **does NOT** use `.env` files from your repository
- Environment variables must be added in Vercel Dashboard

### Solution (Do This Now)

1. **Generate a Secret Key** (if you haven't already):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output (it will be a long string like `a1b2c3d4...`)

2. **Add to Vercel Dashboard**:
   - Go to: https://vercel.com/dashboard
   - Click your project: **blendz-hub-api**
   - Click **Settings** tab (top menu)
   - Click **Environment Variables** (left sidebar)
   - Click **Add New** button
   - **Key**: `JWT_SECRET`
   - **Value**: Paste your generated secret
   - **Environments**: Check all (Production, Preview, Development)
   - Click **Save**

3. **Verify It's Added**:
   - You should see `JWT_SECRET` in the environment variables list
   - Make sure it shows for all environments

4. **Redeploy** (CRITICAL - Variables only apply to new deployments):
   - Go to **Deployments** tab
   - Find your latest deployment
   - Click the **⋯** (three dots menu)
   - Click **Redeploy**
   - Wait for deployment to complete (2-3 minutes)

5. **Test Again**:
   - Try login in Postman with your Vercel URL
   - The error should be gone

## Verify Environment Variables

After redeploying, you can verify the environment variable is set by checking the deployment logs or testing the login endpoint.

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use different JWT_SECRET** for production and development
3. **Make JWT_SECRET long and random** (at least 32 characters)
4. **Rotate JWT_SECRET** periodically if compromised
5. **Keep environment variables secure** - don't share them publicly

## Troubleshooting

### Error: "secretOrPrivateKey must have a value"
- **Cause**: `JWT_SECRET` is not set in Vercel environment variables
- **Fix**: Add `JWT_SECRET` in Vercel dashboard and redeploy

### Error: "JWT_SECRET is not configured"
- **Cause**: Same as above - environment variable missing
- **Fix**: Set `JWT_SECRET` in Vercel and redeploy

### Tokens not working after deployment
- **Cause**: Different `JWT_SECRET` between environments
- **Fix**: Ensure same `JWT_SECRET` is used across all environments

## Quick Setup Checklist

- [ ] Generate a secure JWT_SECRET (32+ characters)
- [ ] Add JWT_SECRET to Vercel environment variables
- [ ] Add MONGO_URI to Vercel environment variables
- [ ] Select all environments (Production, Preview, Development)
- [ ] Redeploy the application
- [ ] Test login endpoint
- [ ] Verify tokens are being generated correctly


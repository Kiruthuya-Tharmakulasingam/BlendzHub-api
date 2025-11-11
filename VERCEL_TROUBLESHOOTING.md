# Vercel JWT_SECRET Troubleshooting

## Still Getting "secretOrPrivateKey must have a value" Error?

Follow these steps **in order**:

## Step 1: Verify Environment Variable is Set

1. Go to: **https://vercel.com/dashboard**
2. Click your project: **blendz-hub-api**
3. Click **Settings** tab
4. Click **Environment Variables**
5. **Check if `JWT_SECRET` appears in the list**
   - ✅ If YES → Go to Step 2
   - ❌ If NO → Add it now:
     - Click **Add New**
     - Key: `JWT_SECRET`
     - Value: Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
     - Environments: Select ALL (Production, Preview, Development)
     - Click **Save**

## Step 2: Check Variable Name (Case-Sensitive!)

**The variable name MUST be exactly:** `JWT_SECRET`

Common mistakes:
- ❌ `jwt_secret` (lowercase)
- ❌ `JWT_SECRET_` (trailing underscore)
- ❌ `JWT_SECRET ` (trailing space)
- ❌ `JWT-SECRET` (hyphen instead of underscore)
- ✅ `JWT_SECRET` (correct)

## Step 3: Use Debug Endpoint

I've added a debug endpoint to check if the variable is loaded:

```bash
curl https://blendz-hub-api.vercel.app/api/debug/env
```

**Expected response if JWT_SECRET is set:**
```json
{
  "hasJwtSecret": true,
  "jwtSecretLength": 64,
  "hasMongoUri": true,
  "nodeEnv": "production",
  "message": "JWT_SECRET is set (length: 64)"
}
```

**If you see:**
```json
{
  "hasJwtSecret": false,
  "message": "JWT_SECRET is NOT set..."
}
```

Then the variable is NOT loaded → Go to Step 4

## Step 4: Redeploy (CRITICAL!)

**Environment variables ONLY apply to NEW deployments.**

1. Go to **Deployments** tab in Vercel
2. Click **⋯** (three dots) on the **latest** deployment
3. Click **Redeploy**
4. **Wait for deployment to complete** (2-3 minutes)
5. Check the deployment logs for any errors

## Step 5: Verify After Redeploy

1. Test the debug endpoint again:
   ```bash
   curl https://blendz-hub-api.vercel.app/api/debug/env
   ```
2. If `hasJwtSecret: true`, try login again
3. If still `false`, the variable wasn't added correctly

## Common Issues & Solutions

### Issue 1: Variable Added But Not Working
**Cause:** Didn't redeploy after adding variable
**Solution:** Redeploy (Step 4)

### Issue 2: Variable Shows in Dashboard But Not Working
**Cause:** Wrong environment selected
**Solution:** 
- Edit the variable
- Make sure ALL environments are selected (Production, Preview, Development)
- Save and redeploy

### Issue 3: Works Locally But Not on Vercel
**Cause:** Using `.env` file (Vercel doesn't read it)
**Solution:** Add variable in Vercel Dashboard, not in `.env` file

### Issue 4: Variable Name Typo
**Cause:** Case-sensitive or typo in variable name
**Solution:** Delete and recreate with exact name: `JWT_SECRET`

## Quick Checklist

- [ ] Variable name is exactly `JWT_SECRET` (case-sensitive)
- [ ] Variable has a value (not empty)
- [ ] All environments are selected (Production, Preview, Development)
- [ ] Variable appears in the list in Vercel Dashboard
- [ ] Redeployed after adding/editing the variable
- [ ] Debug endpoint shows `hasJwtSecret: true`
- [ ] Deployment completed successfully

## Still Not Working?

1. **Delete and recreate the variable:**
   - Delete `JWT_SECRET` from Vercel
   - Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Add it again with exact name `JWT_SECRET`
   - Select all environments
   - Redeploy

2. **Check deployment logs:**
   - Go to Deployments → Click on latest deployment
   - Check "Build Logs" and "Function Logs"
   - Look for any errors

3. **Contact Support:**
   - If debug endpoint shows `hasJwtSecret: false` after redeploy
   - Share the debug endpoint response


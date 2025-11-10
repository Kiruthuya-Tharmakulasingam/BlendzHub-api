# Troubleshooting Authentication Issues

## Error: "Not authorized to access this route"

This error can occur for several reasons. Follow these steps to diagnose and fix the issue:

### 1. Check if you're sending the token correctly

**Required Header:**
```
Authorization: Bearer <your-jwt-token>
```

**Common Mistakes:**
- ❌ `Authorization: <token>` (missing "Bearer")
- ❌ `authorization: Bearer <token>` (wrong case - should be "Authorization")
- ❌ Missing the header entirely

**Correct Format:**
```javascript
// Using fetch
fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Using axios
axios.get('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Using Postman/Thunder Client
// Headers tab:
// Key: Authorization
// Value: Bearer <your-token-here>
```

### 2. Check if JWT_SECRET is set

Make sure you have `JWT_SECRET` in your `.env` file:

```env
JWT_SECRET=your-secret-key-here-make-it-long-and-random
JWT_EXPIRE=30d
```

**To fix:**
1. Create or update `.env` file in the root directory
2. Add `JWT_SECRET=your-secret-key-here`
3. Restart your server

### 3. Check if the user is approved

Users must be approved by an admin before they can access protected routes.

**To check:**
```bash
# Login as admin first
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "your-password"
}

# Then check user status
GET /api/users/:userId
Headers: Authorization: Bearer <admin-token>
```

**To approve a user:**
```bash
PUT /api/users/:userId/approve
Headers: Authorization: Bearer <admin-token>
```

### 4. Check if the token is valid and not expired

**Common issues:**
- Token has expired (default: 30 days)
- Token was created with a different JWT_SECRET
- Token is malformed

**Solution:**
- Login again to get a new token
- Make sure JWT_SECRET hasn't changed

### 5. Check if the user has the required role

Some routes require specific roles (admin, owner, etc.).

**Example:**
- `/api/users/*` requires `admin` or `owner` role
- `/api/customers/*` requires `admin` or `owner` role

**To check your role:**
```bash
GET /api/auth/me
Headers: Authorization: Bearer <your-token>
```

**Response will show:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "admin",
    "isApproved": true
  }
}
```

### 6. Complete Authentication Flow

**Step 1: Register a user (if not already registered)**
```bash
POST /api/auth/register
{
  "name": "Your Name",
  "email": "your@email.com",
  "password": "your-password",
  "role": "admin"
}
```

**Step 2: Login as an admin to approve the user**
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin-password"
}

# Save the token from response
```

**Step 3: Approve the user (if not approved)**
```bash
PUT /api/users/:userId/approve
Headers: Authorization: Bearer <admin-token>
```

**Step 4: Login as the user**
```bash
POST /api/auth/login
{
  "email": "your@email.com",
  "password": "your-password"
}

# Save the token from response
```

**Step 5: Use the token to access protected routes**
```bash
GET /api/users
Headers: Authorization: Bearer <your-token>
```

## Quick Debugging Checklist

- [ ] Is the Authorization header present?
- [ ] Is the header format correct? (`Bearer <token>`)
- [ ] Is JWT_SECRET set in .env file?
- [ ] Has the server been restarted after changing .env?
- [ ] Is the user approved? (`isApproved: true`)
- [ ] Does the user have the required role?
- [ ] Is the token valid and not expired?
- [ ] Are you using the correct endpoint?

## Common Error Messages and Solutions

### "Not authorized to access this route. Please provide a valid token..."
- **Cause:** Missing or incorrect Authorization header
- **Solution:** Add `Authorization: Bearer <token>` header

### "Invalid token. Please login again."
- **Cause:** Token is malformed or signed with wrong secret
- **Solution:** Login again to get a new token

### "Token has expired. Please login again."
- **Cause:** Token expiration time has passed
- **Solution:** Login again to get a new token

### "Your account is pending admin approval..."
- **Cause:** User is not approved by admin
- **Solution:** Ask an admin to approve your account

### "User role 'user' is not authorized to access this route"
- **Cause:** User doesn't have required role (needs admin/owner)
- **Solution:** Ask an admin to change your role

## Testing with cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Use token
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## Testing with Postman/Thunder Client

1. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "password"
     }
     ```
   - Copy the `token` from response

2. **Protected Request:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/users`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <paste-token-here>`

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify your `.env` file has `JWT_SECRET` set
3. Make sure the database is connected
4. Verify the user exists in the database
5. Check if the user's `isApproved` field is `true`
6. Verify the user's `role` matches the route requirements


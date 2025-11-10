# User Approval Guide

## How to Approve a User

### Step 1: Create an Admin User (First Time Only)

If you don't have an admin user yet, create one using the script:

```bash
npm run create-admin
```

This will create an admin user with:
- Email: `admin@blendzhub.com` (or from `ADMIN_EMAIL` env variable)
- Password: `Admin@123` (or from `ADMIN_PASSWORD` env variable)
- Role: `admin`
- Status: Already approved

### Step 2: Login as Admin

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@blendzhub.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "name": "System Admin",
    "email": "admin@blendzhub.com",
    "role": "admin",
    "isApproved": true
  }
}
```

**Save the `token` from the response!**

### Step 3: Get Pending Users

**Endpoint:** `GET /api/admin/users/pending`

**Headers:**
```
Authorization: Bearer <your-admin-token>
```

**Response:**
```json
{
  "success": true,
  "total": 1,
  "message": "1 user(s) pending approval",
  "data": [
    {
      "_id": "69101ea98bd56d3df0e16b02",
      "name": "Kiruthuya",
      "email": "kiru@gmail.com",
      "role": "owner",
      "isApproved": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Step 4: Approve the User

**Endpoint:** `PUT /api/admin/users/:id/approve`

**Example:** `PUT /api/admin/users/69101ea98bd56d3df0e16b02/approve`

**Headers:**
```
Authorization: Bearer <your-admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "id": "69101ea98bd56d3df0e16b02",
    "name": "Kiruthuya",
    "email": "kiru@gmail.com",
    "role": "owner",
    "isApproved": true,
    "approvedBy": "...",
    "approvedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Step 5: User Can Now Login

After approval, the user can login using:

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "kiru@gmail.com",
  "password": "kiru@1025"
}
```

## Complete API Examples

### Using cURL

1. **Login as Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blendzhub.com","password":"Admin@123"}'
```

2. **Get Pending Users:**
```bash
curl -X GET http://localhost:5000/api/admin/users/pending \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

3. **Approve User:**
```bash
curl -X PUT http://localhost:5000/api/admin/users/69101ea98bd56d3df0e16b02/approve \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman/Thunder Client

1. **Login as Admin:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@blendzhub.com",
       "password": "Admin@123"
     }
     ```
   - Copy the `token` from response

2. **Get Pending Users:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/admin/users/pending`
   - Headers:
     - `Authorization: Bearer <paste-token-here>`

3. **Approve User:**
   - Method: `PUT`
   - URL: `http://localhost:5000/api/admin/users/69101ea98bd56d3df0e16b02/approve`
   - Headers:
     - `Authorization: Bearer <paste-token-here>`

## Available Roles

- **owner**: Highest level, has admin permissions
- **admin**: Can manage users and access admin routes
- **staff**: Regular staff member
- **user**: Regular user
- **customer**: Customer role

## Other User Management Endpoints

All require admin/owner authentication:

- `GET /api/admin/users` - Get all users (with filters)
- `GET /api/admin/users/pending` - Get pending users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/approve` - Approve user access
- `PUT /api/admin/users/:id/revoke` - Revoke user access
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id` - Update user (general)
- `DELETE /api/admin/users/:id` - Delete user


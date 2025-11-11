# API Quick Guide: Auth, Roles, and Routes

This guide shows how to authenticate, which roles can access what, and concise examples for using each route.

Base URL: `http://localhost:5000`

## Roles
- owner (full access)
- admin (manage users and content)
- staff
- user
- customer

## Auth
- Register (Public): `POST /api/auth/register`
- Login (Public): `POST /api/auth/login`
- Me (Private): `GET /api/auth/me`
- Logout (Private): `POST /api/auth/logout` (blacklists current token)

Example (login → use token):
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blendzhub.com","password":"Admin@123"}' | jq -r .token)

# Use token
curl -X GET http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Authorization header for all protected routes:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Admin (User Management)
All under `/api/admin/users/*` and require `owner` or `admin`.

- List users: `GET /api/admin/users`
- Pending users: `GET /api/admin/users/pending`
- Get user: `GET /api/admin/users/:id`
- Approve user: `PUT /api/admin/users/:id/approve`
- Revoke user: `PUT /api/admin/users/:id/revoke`
- Update role: `PUT /api/admin/users/:id/role` (body: `{ "role": "admin" }`)
- Update user: `PUT /api/admin/users/:id`
- Delete user: `DELETE /api/admin/users/:id`

Minimal example (approve):
```bash
curl -X PUT http://localhost:5000/api/admin/users/<USER_ID>/approve \
  -H "Authorization: Bearer $TOKEN"
```

---

## Entities: Permissions and Endpoints
Most routes require `verifyToken` for authentication. Public routes (customers, salons GET) don't require authentication. Additional `verifyRole([...])` is applied for write operations as noted.

Legend: R = Read (GET list/by id), W = Write (POST/PUT/DELETE)

### Customers `/api/customers`
- R: **Public** (no authentication required)
- W: owner, admin (authentication required)
Examples:
```bash
# Public - no token needed
curl -X GET http://localhost:5000/api/customers
curl -X GET http://localhost:5000/api/customers/<ID>

# Protected - requires admin/owner token
curl -X POST http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","contact":1234567890}'
```

### Products `/api/products`
- R: any authenticated
- W: owner, admin
```bash
curl -X GET http://localhost:5000/api/products -H "Authorization: Bearer $TOKEN"
```

### Salons `/api/salons`
- R: **Public** (no authentication required)
- W: owner, admin (authentication required)
```bash
# Public - no token needed
curl -X GET http://localhost:5000/api/salons
curl -X GET http://localhost:5000/api/salons/<ID>

# Protected - requires admin/owner token
curl -X POST http://localhost:5000/api/salons \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"HQ","location":"City"}'
```

### Equipment `/api/equipments`
- R: any authenticated
- W: owner, admin
```bash
curl -X GET http://localhost:5000/api/equipments -H "Authorization: Bearer $TOKEN"
```

### Feedback `/api/feedbacks`
- R: any authenticated
- Create: owner, admin, staff, user, customer
- Update: owner, admin, staff
- Delete: owner, admin
```bash
curl -X POST http://localhost:5000/api/feedbacks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Great!","rating":5}'
```

### Payments `/api/payments`
- R: owner, admin, staff
- W: owner, admin
```bash
curl -X GET http://localhost:5000/api/payments -H "Authorization: Bearer $TOKEN"
```

### Appointments `/api/appointments`
- R: any authenticated
- W (manage): owner, admin, staff
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date":"2025-01-01","status":"scheduled"}'
```

### Services `/api/services`
- R: any authenticated
- W: owner, admin
```bash
curl -X GET http://localhost:5000/api/services -H "Authorization: Bearer $TOKEN"
```

---

## Validation Errors (Field-Specific)
Example response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "name is required" }
  ]
}
```

## Notes
- Logout blacklists the in-use token; further usage returns "Token access denied."
- Ensure accounts are approved by admin/owner before login succeeds.
- Use role-specific endpoints under `/api/admin/users/*` for user management. 


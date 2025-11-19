# API Filtering and Searching Guide

This document explains how to use filtering and searching capabilities across all API endpoints. **All filtering and searching is done through query parameters on the same GET endpoints - no separate routes are needed.**

## Table of Contents
- [General Principles](#general-principles)
- [Common Parameters](#common-parameters)
- [Resource-Specific Filters](#resource-specific-filters)
- [Examples by Resource](#examples-by-resource)
- [Combining Filters](#combining-filters)

---

## General Principles

### How It Works
- **Single Endpoint**: All filtering and searching uses query parameters on the main GET endpoint
- **Query Parameters**: Add filters as URL query parameters (e.g., `?search=john&status=active`)
- **Combined Filters**: Multiple filters can be combined using `&` (AND logic)
- **Case Insensitive**: Text searches are case-insensitive
- **Partial Matching**: Text searches use partial matching (regex)

### URL Format
```
GET /api/{resource}?param1=value1&param2=value2&param3=value3
```

**Example:**
```
GET /api/salons?search=beauty&type=unisex&sortBy=name&sortOrder=asc
```

---

## Common Parameters

These parameters are available on **all** endpoints that support filtering:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number for pagination | `1` |
| `limit` | Number | Items per page (max: 100) | `10` |
| `sortBy` | String | Field to sort by | Resource-specific |
| `sortOrder` | String | Sort direction: `asc` or `desc` | `desc` |
| `startDate` | Date | Filter by creation date (from) | - |
| `endDate` | Date | Filter by creation date (to) | - |
| `search` | String | Text search across relevant fields | - |

### Date Format
Dates should be in ISO 8601 format or standard date format:
- `2024-01-01`
- `2024-01-01T00:00:00Z`
- `2024-12-31`

---

## Resource-Specific Filters

### 1. Salons (`/api/salons`)

**Base URL:** `GET /api/salons`

**Available Filters:**
- `type` - Salon type: `men`, `women`, `unisex` (supports comma-separated: `men,women`)
- `ownerId` - Filter by owner ID (admin only, owners auto-filtered)
- `search` - Search in: name, location, phone, email
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `name`, `location`, `type`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all salons
GET /api/salons

# Search salons by name
GET /api/salons?search=beauty

# Filter by type
GET /api/salons?type=unisex

# Filter by multiple types
GET /api/salons?type=men,women

# Search and filter combined
GET /api/salons?search=spa&type=unisex

# Sort by name ascending
GET /api/salons?sortBy=name&sortOrder=asc

# Filter by date range
GET /api/salons?startDate=2024-01-01&endDate=2024-12-31

# Pagination
GET /api/salons?page=2&limit=20

# Complete example
GET /api/salons?search=beauty&type=unisex&sortBy=name&sortOrder=asc&page=1&limit=10
```

---

### 2. Customers (`/api/customers`)

**Base URL:** `GET /api/customers`

**Available Filters:**
- `status` - Customer status (supports comma-separated: `active,inactive`)
- `contact` - Filter by contact number (exact match)
- `search` - Search in: name, email, contact (if numeric)
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `name`, `email`, `contact`, `status`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all customers
GET /api/customers

# Search by name or email
GET /api/customers?search=john

# Filter by status
GET /api/customers?status=active

# Filter by multiple statuses
GET /api/customers?status=active,inactive

# Filter by contact number
GET /api/customers?contact=1234567890

# Search and filter combined
GET /api/customers?search=john&status=active

# Sort by name
GET /api/customers?sortBy=name&sortOrder=asc
```

---

### 3. Services (`/api/services`)

**Base URL:** `GET /api/services`

**Available Filters:**
- `search` - Search in: name, description
- `price` - Exact price match
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `discount` - Exact discount amount
- `minDiscount` - Minimum discount
- `maxDiscount` - Maximum discount
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `name`, `price`, `discount`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all services
GET /api/services

# Search services
GET /api/services?search=haircut

# Filter by price range
GET /api/services?minPrice=50&maxPrice=200

# Filter by exact price
GET /api/services?price=100

# Filter by discount
GET /api/services?minDiscount=10&maxDiscount=50

# Combined search and price filter
GET /api/services?search=hair&minPrice=50&maxPrice=150

# Sort by price ascending
GET /api/services?sortBy=price&sortOrder=asc
```

---

### 4. Appointments (`/api/appointments`)

**Base URL:** `GET /api/appointments`

**Available Filters:**
- `status` - Appointment status: `pending`, `accepted`, `in-progress`, `completed`, `cancelled` (supports comma-separated)
- `salonId` - Filter by salon
- `serviceId` - Filter by service
- `staffId` - Filter by staff member
- `customerId` - Filter by customer (admin/owner only)
- `search` - Search in: notes
- `startDate` / `endDate` - Filter by appointment date (not creation date)
- `minAmount` / `maxAmount` - Filter by appointment amount

**Sortable Fields:** `date`, `time`, `amount`, `status`, `createdAt`, `updatedAt`

**Note:** Role-based filtering applies automatically:
- Customers see only their appointments
- Staff see only their appointments
- Owners see only their salon's appointments
- Admins see all appointments

**Examples:**

```bash
# Get all appointments (role-filtered)
GET /api/appointments

# Filter by status
GET /api/appointments?status=pending

# Filter by multiple statuses
GET /api/appointments?status=pending,accepted

# Filter by salon
GET /api/appointments?salonId=507f1f77bcf86cd799439011

# Filter by date range
GET /api/appointments?startDate=2024-01-01&endDate=2024-01-31

# Filter by amount range
GET /api/appointments?minAmount=50&maxAmount=200

# Search in notes
GET /api/appointments?search=urgent

# Combined filters
GET /api/appointments?status=pending&salonId=507f1f77bcf86cd799439011&startDate=2024-01-01
```

---

### 5. Products (`/api/products`)

**Base URL:** `GET /api/products`

**Available Filters:**
- `supplier` - Filter by supplier name (case-insensitive)
- `salonId` - Filter by salon
- `assignedToStaffId` - Filter by assigned staff
- `search` - Search in: name, supplier
- `qualityRating` - Exact quality rating (0-5)
- `minQualityRating` - Minimum quality rating
- `maxQualityRating` - Maximum quality rating
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `name`, `supplier`, `qualityRating`, `createdAt`, `updatedAt`

**Note:** Role-based filtering applies:
- Owners see only their salon's products
- Staff see only their salon's products

**Examples:**

```bash
# Get all products (role-filtered)
GET /api/products

# Search products
GET /api/products?search=shampoo

# Filter by supplier
GET /api/products?supplier=loreal

# Filter by quality rating range
GET /api/products?minQualityRating=3&maxQualityRating=5

# Filter by salon
GET /api/products?salonId=507f1f77bcf86cd799439011

# Combined filters
GET /api/products?search=shampoo&minQualityRating=4&supplier=loreal
```

---

### 6. Equipment (`/api/equipments`)

**Base URL:** `GET /api/equipments`

**Available Filters:**
- `status` - Equipment status: `available`, `in-use`, `maintenance`, `unavailable` (supports comma-separated)
- `salonId` - Filter by salon
- `assignedToStaffId` - Filter by assigned staff
- `search` - Search in: name
- `startDate` / `endDate` - Filter by creation date
- `lastSterlizedStartDate` / `lastSterlizedEndDate` - Filter by last sterilization date

**Sortable Fields:** `name`, `status`, `lastSterlizedDate`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all equipment (role-filtered)
GET /api/equipments

# Search equipment
GET /api/equipments?search=scissors

# Filter by status
GET /api/equipments?status=available

# Filter by multiple statuses
GET /api/equipments?status=available,in-use

# Filter by last sterilization date
GET /api/equipments?lastSterlizedStartDate=2024-01-01&lastSterlizedEndDate=2024-12-31
```

---

### 7. Feedback (`/api/feedbacks`)

**Base URL:** `GET /api/feedbacks`

**Available Filters:**
- `rating` - Exact rating (1-5)
- `minRating` - Minimum rating
- `maxRating` - Maximum rating
- `salonId` - Filter by salon
- `staffId` - Filter by staff member
- `customerId` - Filter by customer
- `appointmentId` - Filter by appointment
- `search` - Search in: comments
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `rating`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all feedback (role-filtered)
GET /api/feedbacks

# Filter by rating
GET /api/feedbacks?rating=5

# Filter by rating range
GET /api/feedbacks?minRating=4&maxRating=5

# Filter by salon
GET /api/feedbacks?salonId=507f1f77bcf86cd799439011

# Search in comments
GET /api/feedbacks?search=excellent

# Combined filters
GET /api/feedbacks?minRating=4&salonId=507f1f77bcf86cd799439011
```

---

### 8. Payments (`/api/payments`)

**Base URL:** `GET /api/payments`

**Available Filters:**
- `method` - Payment method: `cash`, `card`, `online` (supports comma-separated)
- `status` - Payment status: `pending`, `completed`, `failed`, `refunded` (supports comma-separated)
- `salonId` - Filter by salon
- `staffId` - Filter by staff member
- `customerId` - Filter by customer (admin/owner only)
- `appointmentId` - Filter by appointment
- `amount` - Exact amount
- `minAmount` - Minimum amount
- `maxAmount` - Maximum amount
- `startDate` / `endDate` - Filter by creation date
- `paymentStartDate` / `paymentEndDate` - Filter by payment date

**Sortable Fields:** `date`, `amount`, `method`, `status`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all payments (role-filtered)
GET /api/payments

# Filter by payment method
GET /api/payments?method=card

# Filter by multiple methods
GET /api/payments?method=cash,card

# Filter by status
GET /api/payments?status=completed

# Filter by amount range
GET /api/payments?minAmount=50&maxAmount=500

# Filter by payment date
GET /api/payments?paymentStartDate=2024-01-01&paymentEndDate=2024-01-31

# Combined filters
GET /api/payments?method=card&status=completed&minAmount=100
```

---

### 9. Users (`/api/admin/users`)

**Base URL:** `GET /api/admin/users` (Admin only)

**Available Filters:**
- `role` - User role: `owner`, `admin`, `staff`, `user`, `customer` (supports comma-separated)
- `isApproved` - Approval status: `true` or `false`
- `search` - Search in: name, email
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `name`, `email`, `role`, `isApproved`, `createdAt`, `updatedAt`

**Examples:**

```bash
# Get all users
GET /api/admin/users

# Filter by role
GET /api/admin/users?role=customer

# Filter by multiple roles
GET /api/admin/users?role=owner,staff

# Filter by approval status
GET /api/admin/users?isApproved=true

# Search users
GET /api/admin/users?search=john

# Combined filters
GET /api/admin/users?role=customer&isApproved=true&search=john
```

---

### 10. Notifications (`/api/notifications`)

**Base URL:** `GET /api/notifications`

**Available Filters:**
- `isRead` - Read status: `true` or `false`
- `type` - Notification type (supports comma-separated)
- `startDate` / `endDate` - Filter by creation date

**Sortable Fields:** `type`, `isRead`, `createdAt`, `updatedAt`, `readAt`

**Note:** Users only see their own notifications

**Examples:**

```bash
# Get all notifications
GET /api/notifications

# Filter by read status
GET /api/notifications?isRead=false

# Filter by type
GET /api/notifications?type=appointment_created

# Combined filters
GET /api/notifications?isRead=false&type=appointment_created
```

---

## Combining Filters

### Multiple Filters (AND Logic)
All filters are combined with AND logic - all conditions must be met:

```bash
# Example: Find active customers named "john" created in 2024
GET /api/customers?search=john&status=active&startDate=2024-01-01&endDate=2024-12-31
```

### Multiple Values (OR Logic)
Some filters support comma-separated values for OR logic:

```bash
# Example: Find salons of type "men" OR "women"
GET /api/salons?type=men,women

# Example: Find appointments with status "pending" OR "accepted"
GET /api/appointments?status=pending,accepted
```

### Search + Filters
Search works alongside other filters:

```bash
# Example: Search for "beauty" in unisex salons
GET /api/salons?search=beauty&type=unisex
```

---

## Response Format

All filtered endpoints return the same response structure:

```json
{
  "success": true,
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "data": [
    // Array of results
  ]
}
```

---

## Best Practices

1. **Use Pagination**: Always use `page` and `limit` for large datasets
2. **Combine Filters**: Use multiple filters to narrow down results
3. **Use Search**: Use `search` parameter for text-based queries
4. **Sort Results**: Use `sortBy` and `sortOrder` for consistent ordering
5. **Date Ranges**: Use `startDate` and `endDate` for time-based filtering
6. **URL Encoding**: Encode special characters in URLs (e.g., spaces become `%20`)

---

## Common Use Cases

### Find a Salon by Name
```bash
GET /api/salons?search=beauty%20salon
```

### Get Active Customers Created This Month
```bash
GET /api/customers?status=active&startDate=2024-01-01&endDate=2024-01-31
```

### Find Pending Appointments for a Salon
```bash
GET /api/appointments?salonId=507f1f77bcf86cd799439011&status=pending
```

### Search Services by Price Range
```bash
GET /api/services?minPrice=50&maxPrice=200&sortBy=price&sortOrder=asc
```

### Get Unread Notifications
```bash
GET /api/notifications?isRead=false&sortBy=createdAt&sortOrder=desc
```

---

## Notes

- **Role-Based Filtering**: Some endpoints automatically filter results based on user role
- **Case Insensitive**: All text searches are case-insensitive
- **Partial Matching**: Text searches use partial matching (e.g., "john" matches "Johnny")
- **Date Format**: Use ISO 8601 format or standard date strings
- **Max Limit**: The `limit` parameter is capped at 100 items per page
- **Default Sorting**: Each endpoint has a default sort field if not specified

---

## Quick Reference

| Resource | Search Fields | Key Filters |
|----------|---------------|-------------|
| Salons | name, location, phone, email | type, ownerId |
| Customers | name, email, contact | status, contact |
| Services | name, description | price, discount |
| Appointments | notes | status, salonId, serviceId, staffId |
| Products | name, supplier | supplier, qualityRating, salonId |
| Equipment | name | status, salonId |
| Feedback | comments | rating, salonId, staffId |
| Payments | - | method, status, amount |
| Users | name, email | role, isApproved |
| Notifications | title, message | isRead, type |

---

For more details on specific endpoints, refer to the API documentation or source code.


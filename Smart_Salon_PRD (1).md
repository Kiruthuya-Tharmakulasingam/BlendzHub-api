# Smart Salon Management --- Project Requirements (PRD)

**Project:** Smart Salon Management System\
**Owner:** Kiruthuya Tharmakulasingam --- Uki Technology School -
Vavuniya\
**Date:** 06.11.2025. Source: uploaded PRD PDF.

------------------------------------------------------------------------

## 1. Core Problem & Motivation

**Problem:** Poor customer experience in hair salons due to long wait
times, untrained staff, poor hygiene, and lack of booking systems.\
**Why now:** Increased customer expectations for convenience and
hygiene; outdated systems cause revenue loss and poor customer
retention.\
**Success metrics (examples):** - Reduce wait times by **≥ 40%** -
Customer satisfaction **\> 90%** - Repeat customer rate **+25%**

------------------------------------------------------------------------

## 2. Proposed Solution

A Smart Salon Management System for customers, staff, and owners: -
Online appointment booking - Staff scheduling & assignments - Service
listings with pricing - Customer feedback system - Hygiene & staff-skill
management - Reporting dashboards (basic for MVP)

**MVP scope:** bookings, staff schedules, services/prices,
authentication, feedback, simple owner reports.

------------------------------------------------------------------------

## 3. Users & Personas

1.  **Salon Customer** --- book appointments, view services, leave
    feedback. (Moderate tech skill)\
2.  **Salon Staff / Stylist** --- see daily schedule, update status,
    access training/feedback.\
3.  **Salon Owner / Manager** --- track bookings, staff schedules,
    revenue, hygiene, and reports.

------------------------------------------------------------------------

## 4. Functional Requirements

### 4.1 Main Functional Areas

-   **User Authentication** (customers, staff, owners)
-   **Reporting & Analytics**
-   **Online Booking System**
-   **Staff & Service Management**
-   **Customer Feedback & Rating**
-   **Inventory & Product Management** (future)

### 4.2 User-specific Features (MVP)

-   **Customers (High Priority):**
    -   Book appointments online
    -   Provide feedback & ratings
    -   View services & pricing
-   **Staff (High Priority):**
    -   View daily schedule
    -   Update service status and access training
    -   See feedback for improvement
-   **Owner (High Priority):**
    -   View bookings & revenue, staff performance
    -   Manage services, staff, schedule

------------------------------------------------------------------------

## 5. Non-Functional Requirements

-   **Performance:** Main pages load \< 3s. APIs: 95% requests \< 500ms.
-   **Security:** HTTPS, hashed passwords, JWT-based role access. Aim
    ISO 27001 practices.
-   **Scalability:** Target up to 10,000 concurrent users (future).
-   **Availability:** 99.5% uptime target.
-   **Usability:** Mobile-responsive UI.
-   **Maintainability:** Clear structure, logging, API docs.
-   **Data Privacy:** Comply with data protection norms; do not share
    user personal data.

------------------------------------------------------------------------

## 6. Tech Stack & Tools

-   **Backend:** Node.js, Express.js
-   **ORM / DB:** MongoDB using Mongoose
-   **Auth:** JWT (entity-based)
-   **Frontend:** Next.js (planned)
-   **Other services (integrations):** Payment gateway, Email/SMS,
    Mapping API (optional)
-   **Deployment:** Vercel for frontend, Node-host for backend (or
    Heroku/VPS)
-   **Dev Tools:** Git/GitHub, ESLint, OpenAPI

------------------------------------------------------------------------

# Backend Implementation Plan (Express + MongoDB + Mongoose)

\[Project architecture, models, controllers, routes, and code snippets
omitted for brevity in this markdown export.\]

------------------------------------------------------------------------

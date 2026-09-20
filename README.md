# 🚗 SmartRide — Smart Campus & Workplace Carpooling Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_App-black?logo=vercel)](https://smart-carpooling.vercel.app)
[![Render Backend](https://img.shields.io/badge/Render-API_Service-46E3B7?logo=render&logoColor=white)](https://smart-carpooling-backend.onrender.com/api/health)

> 🚀 **Live Web App:** [https://smart-carpooling.vercel.app](https://smart-carpooling.vercel.app)  
> ⚡ **Production API Service:** [https://smart-carpooling-backend.onrender.com](https://smart-carpooling-backend.onrender.com)

> **SmartRide** is a full-stack, peer-to-peer carpooling platform designed for students and corporate employees traveling along similar commute routes. It enables members to discover shared rides, calculate transparent non-commercial fuel splits, track rides in real time, and commute safely within verified campus or company communities.

---

## 📌 Project Overview

Urban and campus commuting often suffers from single-occupancy vehicle congestion, high solo cab fares, and heavy carbon emissions. SmartRide solves this with a trust-first community ridesharing network:

- **True Peer-to-Peer Cost Sharing:** Zero commercial fare markups. Costs are split strictly by trip expenses (fuel, tolls, parking) divided equally among the driver and passengers.
- **Mutual Safety & Verified Profiles:** Verified college/corporate emails, optional government/student ID uploads, live GPS emergency SOS dispatches, and mutual 5-category post-ride reviews.
- **Intelligent Route Matching:** Geospatial matching engine scoring road corridor similarity, departure time compatibility, and pickup/drop-off proximity.
- **Community & Circle Scoping:** Commute exclusively with verified coworkers or university peers, or organize recurring carpool circles.

---

## ✨ Key Features

### 🛣️ Ride Discovery & Smart Matching
- **Interactive Route Mapping:** Search and offer rides using Leaflet maps, Nominatim geocoding, and OSRM driving routes.
- **Matching Engine:** Multi-factor algorithm scoring route corridor overlap (40 pts), departure time compatibility (25 pts), pickup proximity (20 pts), and drop-off proximity (15 pts).
- **Fair Cost Calculator:** Real-time arithmetic splitting fuel, toll, and parking costs equally across occupants.

### ⚡ Atomic Booking & Concurrency Protection
- **Race-Condition-Free Seat Reservations:** Atomic conditional updates (`availableSeats: { $gte: seats }`, `$inc`) preventing double-booking even under concurrent traffic spikes.
- **Seat Auto-Restoration:** Automatically restores seats back to the ride pool if a booking is cancelled or rejected.

### 📡 Real-Time GPS Tracking & Live In-Ride Chat
- **WebSockets (Socket.IO):** Live location broadcasting with animated car markers along the route.
- **In-Ride Group Messaging:** Ephemeral, real-time passenger-driver chat rooms scoped strictly to active ride participants.

### 🛡️ Safety, Trust & Privacy
- **1-Tap SOS Emergency Trigger:** Dispatches simulated SMS alerts with live GPS coordinates to saved emergency contacts and gives immediate 1-tap dialer buttons to emergency services (112, 108, 1091).
- **Time-Boxed Expiring Tracking Links:** Share live trip progress with family via a secret URL. Once the ride completes or cancels, the link immediately invalidates (`HTTP 410 Gone`) to prevent location telemetry leaks.
- **Mutual 5-Category Reviews:** Drivers and passengers rate each other across Punctuality, Driving Safety, Behaviour, Cleanliness, and Overall Experience.
- **ID Verification:** Upload student or government IDs for verified commuter status.

### 📊 ESG & Personal Impact Analytics
- **Personal Impact Dashboard:** Computes cumulative money saved (vs. solo cabs), shared kilometers, CO₂ emissions prevented (kg), and tree equivalents.
- **Interactive Visualizations:** Recharts AreaCharts and BarCharts showing monthly commute savings trajectories and category rating breakdowns.
- **Platform Analytics:** Corridor rankings, ride completion ratios, and macroscopic ESG metrics.

### 🔄 Advanced Commute Features (Phase 8)
- **Recurring Commuter Schedules:** Generate repeat ride instances (e.g., Mon–Fri for 2, 4, or 8 weeks) with linked series management and granular single vs. whole-series cancellation.
- **Carpool Groups:** Create or join private commuter circles using unique 6-character invite codes, complete with member rosters and dedicated group ride feeds.
- **Community Scoping:** Restrict ride visibility and booking permissions exclusively to colleagues from your verified organization.
- **Admin Operations Console:** Dedicated `/admin` control center for user search, account suspension, ride moderation, and live SOS alert resolution.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Framer Motion, Recharts, Leaflet, OpenStreetMap, Axios, TanStack React Query, Socket.IO Client |
| **Backend** | Node.js (ES Modules), Express 4, Socket.IO 4, Mongoose 8, JSON Web Tokens (JWT), bcryptjs, Zod, Multer, Cloudinary SDK, Helmet, Express Rate Limit |
| **Database** | MongoDB Atlas (Production/Dev) with automatic fallback to `mongodb-memory-server` in local dev/testing |
| **Tooling** | Concurrently, Nodemon, Native Node Test Runners |

---

## 📁 Project Structure

```
carpooling/
├── backend/                        # Modular Express & Node.js API
│   ├── src/
│   │   ├── controllers/            # Request handlers (auth, rides, bookings, admin, etc.)
│   │   ├── middleware/             # requireAuth, requireRole, errorHandler, rateLimiter
│   │   ├── models/                 # Mongoose schemas (User, Vehicle, Ride, Booking, Group, etc.)
│   │   ├── routes/                 # Express route definitions with Zod validation
│   │   ├── services/               # Core business logic (matching engine, seat transactions)
│   │   ├── socket/                 # Socket.IO event handlers & connection managers
│   │   ├── tests/                  # Automated test suites (auth, concurrency, safety, etc.)
│   │   ├── utils/                  # DB connection, admin seeders, migration scripts
│   │   └── server.js               # Express application entry point & HTTP listener
│   ├── .env.example                # Template for backend environment variables
│   └── package.json
├── frontend/                       # React 18 Single Page Application (Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI components (Navbar, Footer, Modals)
│   │   │   ├── analytics/          # Personal & platform ESG metric cards & Recharts
│   │   │   ├── chat/               # In-ride live chat components
│   │   │   ├── map/                # Location autocomplete, map pickers, route maps
│   │   │   └── safety/             # SOS triggers, review modals, verification cards
│   │   ├── context/                # AuthContext (JWT management & session handling)
│   │   ├── layouts/                # MainLayout wrapper
│   │   ├── pages/                  # Route views (Dashboard, Search, Admin, Groups, etc.)
│   │   ├── services/               # Axios API clients & Socket.IO client instances
│   │   ├── utils/                  # Geo calculations, formatters, and helpers
│   │   ├── App.jsx                 # Route registrations & role guards
│   │   └── main.jsx                # React root entry
│   ├── vite.config.js              # Dev server configuration & reverse proxy rules
│   └── package.json
├── docs/                           # Architecture, database schema, and API references
├── package.json                    # Monorepo root scripts (dev, install:all)
└── README.md
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/radhika817/Smart-Carpooling-.git
cd Smart-Carpooling-
```

### 3. Install Dependencies
You can install dependencies for the root, backend, and frontend with a single command:
```bash
npm run install:all
```
*(Or manually run `npm install` inside the root, `backend/`, and `frontend/` folders).*

---

## 🔐 Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Configure your `backend/.env` file using the safe placeholders below:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Authentication (JWT)
JWT_SECRET=your_super_secret_jwt_key_replace_in_production
JWT_EXPIRES_IN=7d

# Database
# Leave blank to automatically use the local In-Memory MongoDB server during development.
# Or provide a MongoDB Atlas connection string:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartride?retryWrites=true&w=majority

# Initial System Administrator (Auto-provisioned on startup)
ADMIN_EMAIL=admin@smartride.com
ADMIN_PASSWORD=Admin@123456

# Optional: Cloudinary (For remote image/vehicle document uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note on MongoDB:** If `MONGODB_URI` is left empty, the backend automatically initializes an in-memory database (`mongodb-memory-server`) so you can test immediately without any external database setup.

---

## 🏃 Running the Application

### Option A: Run Both Frontend & Backend Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```

### Option B: Run Individually

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
```
*Backend runs on:* `http://localhost:5000`  
*API Health check:* `http://localhost:5000/api/health`

**Terminal 2 — Frontend Client:**
```bash
cd frontend
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🔄 How the System Connects

```
┌───────────────────────────┐           ┌───────────────────────────┐           ┌───────────────────────────┐
│     React + Vite Client   │           │    Express API + Socket   │           │      MongoDB Database     │
│   (http://localhost:5173) │           │   (http://localhost:5000) │           │      (Atlas or Memory)    │
└─────────────┬─────────────┘           └─────────────┬─────────────┘           └─────────────┬─────────────┘
              │                                       │                                       │
              │  1. REST Requests (/api/*)            │                                       │
              ├──────────────────────────────────────>│  Mongoose Queries                     │
              │  (Proxied seamlessly by Vite)         ├──────────────────────────────────────>│
              │                                       │<──────────────────────────────────────┤
              │<──────────────────────────────────────┤                                       │
              │                                       │                                       │
              │  2. WebSockets (/socket.io/*)         │                                       │
              │<=====================================>│                                       │
              │  (Live GPS broadcast, SOS, chat)      │                                       │
```

1. **API Proxy:** In development, Vite's dev server (`port 5173`) proxies all `/api` and `/socket.io` requests to the Express server (`port 5000`), eliminating CORS configuration headaches.
2. **Authentication:** User authentication issues a signed JSON Web Token (JWT). The frontend Axios client attaches this token (`Authorization: Bearer <token>`) to outgoing requests and handles automatic logout on token expiration (HTTP 401).
3. **WebSockets:** Socket.IO coordinates private, room-based events (`join_ride`, `location_update`, `send_message`, `sos_alert`) strictly between participants of an active trip.
4. **Database Layer:** The backend connects to MongoDB Atlas using Mongoose 8. In local development or automated test mode, it automatically boots an isolated in-memory MongoDB instance if no Atlas URI is provided.

---

## 🧪 Testing Instructions

The backend features an automated test suite covering authentication, atomic concurrency, geospatial route matching, WebSockets, emergency SOS guardrails, and admin governance.

### Run All Backend Tests:
```bash
npm run test:backend
```

### Run Specific Test Suites:
```bash
cd backend

# Authentication & Session Validation
node src/tests/auth.test.js

# High-Concurrency Seat Allocation & Race Condition Prevention
node src/tests/concurrency.test.js

# Complete Ride Lifecycle & Booking Flow
node src/tests/phase2_e2e.test.js

# Geospatial Corridor & Pure-Function Matching Engine
node src/tests/phase4_matching.test.js

# WebSockets, Room Isolation, & Telemetry
node src/tests/phase5_socket.test.js

# SOS Emergency Dispatch, Share Token Expiration, & Ratings
node src/tests/phase6_safety.test.js

# Personal Impact & ESG Calculations
node src/tests/phase7_analytics.test.js

# Recurring Rides, Carpool Groups, & Admin Console
node src/tests/phase8_advanced.test.js
```

### Frontend Build Verification:
```bash
cd frontend
npm run build
```

### Pre-Configured Demo Accounts:
The backend automatically provisions these verified test accounts on startup for fast UI testing:

| Role | Email | Password | Pre-Configured Features |
| :--- | :--- | :--- | :--- |
| **Demo Passenger** | `demo.passenger@smartride.edu` | `DemoPass123!` | Verified email, phone, college org, ID |
| **Demo Driver** | `demo.driver@smartride.edu` | `DemoPass123!` | Verified + Pre-registered *Tata Nexon EV* vehicle |
| **Demo Admin** | `demo.admin@smartride.edu` | `DemoPass123!` | Full operations console & safety oversight privilege |

*(You can test these instantly on the live site at [smart-carpooling.vercel.app/login](https://smart-carpooling.vercel.app/login) using the 1-click **Quick Demo Fill** buttons).*

---

## 🐛 Common Troubleshooting

### 1. Port 5000 or 5173 Already in Use
- **Issue:** `Error: listen EADDRINUSE: address already in use :::5000`
- **Solution:** Another instance is running on that port. Find and stop it:
  ```bash
  # Linux/macOS
  lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9
  ```

### 2. MongoDB Connection Timeout
- **Issue:** `MongooseServerSelectionError: connection timed out`
- **Solution:** 
  1. If using MongoDB Atlas, verify your IP address is whitelisted in MongoDB Atlas Network Access (`0.0.0.0/0` for development).
  2. Alternatively, remove or comment out `MONGODB_URI` in `backend/.env` to let the application fall back to the built-in local memory database.

### 3. Access Denied on Admin Routes (`/admin`)
- **Issue:** Attempting to view the Admin Console shows "Access Denied" or returns HTTP 403.
- **Solution:** Sign in with the administrator account configured in `backend/.env` (`admin@smartride.com` / `Admin@123456`). If you need to re-seed the admin user, run:
  ```bash
  cd backend && npm run seed:admin
  ```

### 4. Leaflet Map Tiles Not Loading
- **Issue:** Map container displays a grey background without street tiles.
- **Solution:** Leaflet pulls OpenStreetMap tiles over standard HTTPS (`https://tile.openstreetmap.org`). Ensure you have an active internet connection and that your network or adblocker is not blocking OpenStreetMap requests.

---

## 👨‍💻 Authors & Acknowledgments

- **Lead Developer:** [radhika817](https://github.com/radhika817)
- **Repository:** [Smart-Carpooling-](https://github.com/radhika817/Smart-Carpooling-)
- **Designed for:** Modern, sustainable campus and workplace mobility.

---

<p align="center">Made with ❤️ for greener, safer, and smarter daily commutes.</p>

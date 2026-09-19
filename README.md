# 🚗 SmartRide — Smart Carpooling & Ride Sharing Platform

SmartRide is a web-based carpooling and ride-sharing platform designed for students and employees traveling along similar routes, helping them share rides, reduce travel costs, and support sustainable transportation.

---

## 🎯 Architecture & Technology Stack

- **Architecture:** Modular Monolith (Express backend with clear module boundaries)
- **Frontend:** React, Vite, Tailwind CSS, Lucide React, Framer Motion, React Router, Axios, TanStack Query
- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt, Zod, Socket.IO
- **Database:** MongoDB (Atlas production, in-memory development fallback)
- **Maps:** Leaflet, OpenStreetMap, Nominatim

---

## 📁 Repository Structure

```
smart-ride/
├── frontend/             # React + Vite client
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Views (Home, Login, Register, Dashboard)
│       ├── layouts/      # Navbar, Footers, Shells
│       ├── hooks/        # Custom React hooks
│       ├── services/     # Axios API modules
│       ├── context/      # AuthContext & state
│       └── utils/        # Formatters, helpers
├── backend/              # Modular Express server
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── models/       # Mongoose schemas (User, Vehicle, Ride, Booking, Rating)
│       ├── routes/       # Express route definitions with Zod validation
│       ├── middleware/   # requireAuth, requireRole, rateLimiter, errorHandler
│       ├── services/     # Business logic & matching pure-function
│       ├── socket/       # Socket.IO handlers
│       ├── utils/        # DB connection, logger, helpers
│       └── server.js     # Express app & HTTP server entry
├── docs/                 # System architecture, database schema, API reference
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- npm >= 9

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Or install backend and frontend individually:
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run Development Servers
```bash
# Run both backend and frontend concurrently:
npm run dev

# Or run backend only:
npm run dev:backend

# Or run frontend only:
npm run dev:frontend
```

Frontend runs at: `http://localhost:5173`  
Backend API runs at: `http://localhost:5000`

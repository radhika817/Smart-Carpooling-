# SmartRide — System Architecture

**Version:** 1.0 (V1 / MVP scope)  
**Status:** Design reference  

---

## 1. Design Goals & Constraints

| Constraint | Implication |
|---|---|
| Single small team, beginner-friendly stack | Favor a monolith over microservices |
| MERN stack (MongoDB, Express, React, Node) | Document-oriented data modeling |
| Deploy to Vercel + Render + Atlas | Stateless API instances, externalized DB |
| V1 must ship an MVP fast | Defer geospatial DB, Redis, ML to V2 |
| Live tracking + chat required | Needs a persistent connection layer (Socket.IO) alongside REST |
| Safety-critical (SOS, location sharing) | Location data must be minimal-retention and access-scoped |

**Chosen architecture: Modular Monolith.** One deployable Express application, internally divided into clearly bounded modules (Auth, Matching, Booking, Realtime, Safety, Analytics), sharing one MongoDB database. Module boundaries are enforced at the code level (separate service files, no cross-module reach-into-model), not at the network level — so any module can be extracted into its own service later without redesigning the system.

---

## 2. High-Level Architecture

```
                        ┌─────────────────────────┐
                        │   Client (React SPA)     │
                        │  Vite + Tailwind + shadcn │
                        └───────────┬───────────────┘
                                    │
                     REST (Axios + TanStack Query)
                                    │
                                    ▼
                  ┌───────────────────────────────────┐
                  │     API Server — Express (Node)     │
                  │                                     │
                  │  ┌────────┐ ┌──────────┐ ┌────────┐ │
                  │  │  Auth  │ │ Matching │ │Booking │ │
                  │  └────────┘ └──────────┘ └────────┘ │
                  │  ┌────────┐ ┌──────────┐            │
                  │  │ Safety │ │ Realtime │◄──Socket.IO─┼── Client (WS)
                  │  └────────┘ └──────────┘            │
                  └───────┬───────────┬────────┬─────────┘
                          │           │        │
                          ▼           ▼        ▼
                  ┌──────────┐ ┌───────────┐ ┌────────────────┐
                  │ MongoDB  │ │ Cloudinary│ │ Maps APIs        │
                  │ Atlas    │ │ (media)   │ │ (Leaflet/Nominatim)│
                  └──────────┘ └───────────┘ └────────────────┘
```

- **Client → API:** stateless REST, JWT bearer auth on protected routes.
- **Client ↔ Realtime module:** persistent Socket.IO connection, scoped to per-ride rooms/namespaces.
- **API → MongoDB Atlas:** single logical database, one connection pool per API instance (via Mongoose).
- **API → Cloudinary:** signed upload flow for profile photos / vehicle images.
- **API → Maps APIs:** server-side geocoding (Nominatim) only where needed; most map rendering happens client-side with Leaflet directly against OSM tiles.

---

## 3. Module Breakdown

### 3.1 Auth module
- Responsibilities: register, login/logout, JWT issuance/verification, password reset, email verification, optional Google OAuth.
- Password hashing: bcrypt, cost factor ≥ 10.
- JWT: short-lived access token; refresh handled via re-login for V1 (refresh-token rotation deferred to V2 unless needed sooner).
- Exposes middleware `requireAuth` and `requireRole(role)` consumed by every other module — this is the one module every other module is allowed to depend on.

### 3.2 User & Vehicle module
- CRUD for user profile, vehicle records.
- Vehicle ownership check on every mutation (`vehicle.owner === req.user.id`).

### 3.3 Rides module
- CRUD for `Ride` documents, status transitions (`OPEN → BOOKING → CONFIRMED → DRIVER_ARRIVING → IN_PROGRESS → COMPLETED / CANCELLED / NO_SHOW`).
- Owns the ride search endpoint (filters: pickup, destination, date, time, seats).
- Delegates scoring to the Matching module — Rides module never computes match percentages itself.

### 3.4 Matching module (isolated deliberately)
- Pure function boundary: `scoreRide(ride, searchCriteria) → { score, breakdown }`.
- V1 scoring (application-level, no PostGIS):
  - Route Similarity: 40%
  - Time Compatibility: 25%
  - Pickup Proximity: 20%
  - Destination Proximity: 15%
- Distance calculations use MongoDB `2dsphere` geo queries as a first-pass filter (narrow candidates within an initial radius), then application-level scoring refines and ranks the result — this avoids scoring every ride in the database on every search.
- Isolating this module is the single highest-leverage decision in the whole system: it is the module most likely to be replaced (PostGIS routing, ML-based ranking, a separate matching service) per the V2 roadmap. Because it has one function signature in and one result shape out, swapping its internals — or extracting it into its own deployable service — does not require touching Rides, Booking, or the API routing layer.

### 3.5 Booking module
- Owns the request → accept/reject → confirm lifecycle.
- **Concurrency-critical path:** seat booking must be atomic. Use a single conditional update, not a read-then-write:

```js
// Atomic seat decrement — prevents overbooking under concurrent requests
const ride = await Ride.findOneAndUpdate(
  { _id: rideId, availableSeats: { $gte: requestedSeats } },
  { $inc: { availableSeats: -requestedSeats } },
  { new: true }
);
if (!ride) throw new ConflictError("Not enough seats available");
```

- If accept/reject requires multi-document consistency (Ride + Booking updated together), wrap in a MongoDB session/transaction.

### 3.6 Realtime module (Socket.IO)
- One Socket.IO namespace per ride: `/rides/{rideId}`.
- Join-room authorization: verify the connecting user is a participant (driver or confirmed passenger) of that ride before allowing them into the room — this is the access control for both location broadcast and chat.
- Events: `location:update`, `location:broadcast`, `chat:message`, `ride:status`.
- V1 state storage: in-memory (per Node process) — acceptable because V1 runs a single Render instance.

### 3.7 Safety module
- SOS trigger: captures current location + active ride + driver/passenger details, notifies emergency contacts.
- Ride sharing: generates a time-boxed, revocable share link/token; location exposed only while the ride is active and the share is live — no permanent location history retained beyond what's needed for the completed ride record.

### 3.8 Analytics module
- Aggregates money saved, distance shared, CO₂ estimate, ratings — computed from completed `Ride`/`Booking` records, not tracked as a separate live counter (avoids double-bookkeeping bugs).

---

## 4. Security & Privacy

- Passwords: bcrypt hash (cost ≥ 10), never logged or returned in any API response.
- All mutating routes behind `requireAuth`; role-sensitive routes behind `requireRole`.
- Input validation with Zod at the route boundary — reject before it reaches a service function.
- Rate limiting on auth endpoints (login, register) to blunt brute force.
- CORS locked to the deployed frontend origin(s) only.
- Precise location exposed only during active rides to verified participants.

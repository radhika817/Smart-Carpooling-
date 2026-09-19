# SmartRide — Database Schema Documentation

This document outlines the MongoDB collections, fields, relationships, and indexes used in SmartRide.

---

## 1. Collections & Relationships Overview

```
User (1) ────────< (N) Vehicle [owner: User]
User (1) ────────< (N) Ride [driver: User]
Ride (1) ────────< (N) Booking [ride: Ride, passenger: User]
User (1) ────────< (N) Booking [passenger: User]
Ride (1) ────────< (N) Rating [ride: Ride, from: User, to: User]
```

`Ride` and `Booking` are deliberately kept as **separate collections** rather than embedding bookings inside rides, supporting independent indexing and high-throughput queries by passenger, status, or date.

---

## 2. Collections Schema

### 2.1 `users` Collection

| Field | Type | Required | Default | Details |
|---|---|---|---|---|
| `name` | String | Yes | - | Full name, trimmed |
| `email` | String | Yes | - | Unique, lowercase, trimmed |
| `passwordHash` | String | Yes | - | bcrypt hashed (cost ≥ 10), hidden by default |
| `phone` | String | No | "" | Mobile contact number |
| `profileImage` | String | No | "" | Cloudinary URL / avatar URL |
| `organization`| String | No | "" | University / Company affiliation |
| `role` | String | Yes | `"passenger"` | Enum: `['passenger', 'driver', 'admin']` |
| `rating` | Object | Yes | `{ average: 5.0, count: 0 }` | Aggregated rating |
| `rating.average`| Number | Yes | 5.0 | Average user score (1.0 - 5.0) |
| `rating.count` | Number | Yes | 0 | Total reviews received |
| `verificationStatus` | Object | Yes | - | `{ email: false, phone: false, organization: false }` |
| `preferences` | Object | Yes | - | `{ smoking: false, music: true, petFriendly: false, quietRide: false }` |
| `createdAt` | Date | Auto | - | Timestamp |
| `updatedAt` | Date | Auto | - | Timestamp |

**Indexes:**
- `email`: `{ unique: true }`

---

### 2.2 `vehicles` Collection

| Field | Type | Required | Details |
|---|---|---|---|
| `owner` | ObjectId | Yes | Ref to `User` |
| `model` | String | Yes | e.g. "Honda Civic 2022", "Tata Nexon EV" |
| `registrationNumber` | String | Yes | Unique vehicle license plate / reg |
| `type` | String | Yes | Enum: `['sedan', 'suv', 'hatchback', 'electric', 'motorcycle']` |
| `seats` | Number | Yes | Seating capacity excluding driver (1 to 8) |
| `image` | String | No | Cloudinary URL |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps |

**Indexes:**
- `owner`: `{ index: true }`
- `registrationNumber`: `{ unique: true }`

---

### 2.3 `rides` Collection

| Field | Type | Required | Details |
|---|---|---|---|
| `driver` | ObjectId | Yes | Ref to `User` |
| `vehicle` | ObjectId | Yes | Ref to `Vehicle` |
| `startLocation` | GeoJSON Point | Yes | `{ type: "Point", coordinates: [lng, lat], address: String }` |
| `destination` | GeoJSON Point | Yes | `{ type: "Point", coordinates: [lng, lat], address: String }` |
| `route` | Array/Object | No | Waypoints / polyline geometry |
| `date` | Date | Yes | Ride scheduled date |
| `departureTime` | String | Yes | e.g. "08:30" |
| `availableSeats` | Number | Yes | Decremented atomically on booking confirmation |
| `totalSeats` | Number | Yes | Initial seat count offered |
| `estimatedCost` | Object | Yes | `{ total: Number, perPassenger: Number, fuel: Number, toll: Number, parking: Number }` |
| `status` | String | Yes | Enum: `['OPEN', 'BOOKING', 'CONFIRMED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']` |
| `preferences` | Object | No | Specific ride notes or ride-level preference overrides |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps |

**Indexes:**
- `startLocation`: `2dsphere`
- `destination`: `2dsphere`
- `date, status`: Compound index for rapid filtering
- `driver`: Index for driver ride history

---

### 2.4 `bookings` Collection

| Field | Type | Required | Details |
|---|---|---|---|
| `ride` | ObjectId | Yes | Ref to `Ride` |
| `passenger` | ObjectId | Yes | Ref to `User` |
| `pickupPoint` | GeoJSON Point | Yes | Proposed pickup spot |
| `dropPoint` | GeoJSON Point | Yes | Proposed drop spot |
| `seats` | Number | Yes | Number of seats booked (default: 1) |
| `cost` | Number | Yes | Cost share for this booking |
| `status` | String | Yes | Enum: `['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']` |
| `createdAt` / `updatedAt` | Date | Auto | Timestamps |

**Indexes:**
- `ride, passenger`: Compound index
- `passenger, status`: Index for passenger dashboard queries

---

### 2.5 `ratings` Collection

| Field | Type | Required | Details |
|---|---|---|---|
| `ride` | ObjectId | Yes | Ref to `Ride` |
| `from` | ObjectId | Yes | Ref to `User` |
| `to` | ObjectId | Yes | Ref to `User` |
| `categories` | Object | Yes | `{ overall: 1-5, punctuality: 1-5, safety: 1-5, behaviour: 1-5, cleanliness: 1-5 }` |
| `comment` | String | No | Optional review text |
| `createdAt` | Date | Auto | Timestamp |

**Indexes:**
- `ride, from, to`: Unique compound index ensuring one rating per participant pair per ride

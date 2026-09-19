# SmartRide — API Specification

Base URL: `/api`

All JSON request bodies and responses use standard UTF-8 JSON.
Protected endpoints require: `Authorization: Bearer <jwt_token>`

Standard Response Envelope:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Standard Error Envelope:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account, hashes password with bcrypt (cost ≥ 10), generates JWT.
- **Access:** Public (rate limited)
- **Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@university.edu",
  "password": "Password123!",
  "phone": "+919876543210",
  "role": "passenger",
  "organization": "XYZ University",
  "preferences": {
    "smoking": false,
    "music": true,
    "petFriendly": false,
    "quietRide": false
  }
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "65f01ab...",
      "name": "Rahul Sharma",
      "email": "rahul@university.edu",
      "role": "passenger",
      "organization": "XYZ University",
      "verificationStatus": { "email": false, "phone": false, "organization": false },
      "rating": { "average": 5.0, "count": 0 }
    },
    "token": "eyJhbGciOiJIUz..."
  }
}
```

### `POST /api/auth/login`
Authenticates existing user with email and password.
- **Access:** Public (rate limited)
- **Body:**
```json
{
  "email": "rahul@university.edu",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUz..."
  }
}
```

### `POST /api/auth/logout`
Logs user out on client side.
- **Access:** Public

### `GET /api/auth/me`
Fetches the currently authenticated user profile.
- **Access:** Protected (`requireAuth`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## 2. Users (`/api/users`)
- `GET /api/users/me` — Full profile with stats
- `PUT /api/users/me` — Update profile info and travel preferences

---

## 3. Vehicles (`/api/vehicles`)
- `POST /api/vehicles` — Register vehicle (Driver only)
- `GET /api/vehicles` — List current user's vehicles
- `PUT /api/vehicles/:id` — Update vehicle
- `DELETE /api/vehicles/:id` — Delete vehicle

---

## 4. Rides (`/api/rides`)
- `POST /api/rides` — Create ride (Driver only, 2dsphere GeoJSON points)
- `GET /api/rides` — List recent/open rides
- `GET /api/rides/:id` — Get single ride details
- `PUT /api/rides/:id` — Update ride
- `DELETE /api/rides/:id` — Cancel/delete ride
- `GET /api/rides/search` — Search rides with geo proximity & matching score
- `POST /api/rides/:id/start` — Start ride (changes status to `IN_PROGRESS`)
- `POST /api/rides/:id/complete` — Complete ride (changes status to `COMPLETED`)

---

## 5. Bookings (`/api/bookings`)
- `POST /api/rides/:id/book` — Request a seat (atomic seat reservation guard)
- `GET /api/bookings` — User's bookings (as passenger or driver)
- `POST /api/bookings/:id/accept` — Driver accepts booking
- `POST /api/bookings/:id/reject` — Driver rejects booking
- `POST /api/bookings/:id/cancel` — Passenger cancels booking

---

## 6. Realtime & Safety
- Real-time Socket.IO namespaces: `/rides/{rideId}`
- `POST /api/safety/sos` — Trigger emergency alert
- `POST /api/rides/:id/share` — Create time-boxed tracking link
- `POST /api/ratings` — Submit post-ride rating
- `GET /api/analytics/me` — Personal impact metrics

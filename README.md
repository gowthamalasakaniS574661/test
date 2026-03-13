# Ride-Share Authentication API

User authentication API built with Node.js, Express, MongoDB, and JWT. Supports role-based access control for **passenger** and **driver** roles.

## Features

- User signup and login
- JWT-based authentication
- Password hashing with bcrypt (12 salt rounds)
- Role-based authorization (passenger / driver)
- Input validation with express-validator
- Protected route middleware

## Project Structure

```
src/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   └── authController.js    # Signup, login, profile logic
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── authorize.js         # Role-based authorization middleware
├── models/
│   └── User.js              # Mongoose User model
├── routes/
│   └── auth.js              # Auth route definitions
└── server.js                # Express app entry point
```

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description | Default |
   | --- | --- | --- |
   | `PORT` | Server port | `3000` |
   | `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ride-share-auth` |
   | `JWT_SECRET` | Secret key for signing JWTs | *(must be set)* |
   | `JWT_EXPIRES_IN` | Token expiry duration | `7d` |

3. **Start MongoDB** (must be running locally or provide a remote URI).

4. **Run the server:**

   ```bash
   npm start        # production
   npm run dev      # development (auto-restart on file changes)
   ```

## API Endpoints

### Public Routes

#### `POST /api/auth/signup`

Register a new user.

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "passenger",
  "phone": "+1234567890"
}
```

- `role` is optional, defaults to `"passenger"`. Accepted values: `"passenger"`, `"driver"`.
- `phone` is optional.

**Response (201):**

```json
{
  "message": "User registered successfully.",
  "token": "eyJhbGciOi...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "passenger",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### `POST /api/auth/login`

Log in an existing user.

**Body:**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response (200):**

```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOi...",
  "user": { ... }
}
```

### Protected Routes

All protected routes require an `Authorization` header:

```
Authorization: Bearer <token>
```

#### `GET /api/auth/profile`

Returns the authenticated user's profile. Accessible by any authenticated user.

#### `GET /api/auth/passenger-only`

Accessible only by users with the `passenger` role.

#### `GET /api/auth/driver-only`

Accessible only by users with the `driver` role.

### Health Check

#### `GET /health`

Returns server status.

## Using the Middleware in Your Own Routes

```javascript
const authenticate = require('./src/middleware/auth');
const authorize = require('./src/middleware/authorize');

// Any authenticated user
router.get('/some-route', authenticate, handler);

// Only drivers
router.get('/driver-route', authenticate, authorize('driver'), handler);

// Passengers or drivers
router.get('/shared-route', authenticate, authorize('passenger', 'driver'), handler);
```

## Error Responses

All error responses follow this format:

```json
{
  "message": "Description of the error."
}
```

Validation errors return an `errors` array:

```json
{
  "errors": [
    { "msg": "Email is required", "path": "email", "location": "body" }
  ]
}
```

| Status | Meaning |
| --- | --- |
| 400 | Validation error |
| 401 | Not authenticated / invalid credentials |
| 403 | Forbidden (wrong role) |
| 409 | Conflict (email already registered) |
| 500 | Server error |

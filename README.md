# RideShare Marketplace

A full-stack ride-sharing marketplace platform with a bidding system, built with Node.js/Express, PostgreSQL, and React Native.

## Architecture

```
rideshare-marketplace/
├── backend/                  # Express REST API
│   └── src/
│       ├── config/           # App & database configuration
│       ├── controllers/      # Route handlers
│       ├── middleware/        # Auth, validation, error handling
│       ├── migrations/       # Database schema & seed data
│       ├── routes/           # API route definitions
│       └── validators/       # Request validation rules
├── mobile/                   # React Native (Expo) app
│   └── src/
│       ├── api/              # API client & service modules
│       ├── components/map/   # Map components (RouteMap, LocationPicker, RideInfoOverlay)
│       ├── config/           # App configuration (maps API keys)
│       ├── contexts/         # React contexts (auth state)
│       ├── hooks/            # Custom hooks (useRouteDirections, useLiveTracking)
│       ├── navigation/       # Stack & tab navigators
│       ├── screens/          # UI screens (auth, driver, passenger, shared)
│       ├── services/         # Background services (location tracking)
│       └── utils/            # Utility functions (location, distance)
└── shared/                   # Shared constants & types
```

## Features

- **User Authentication** — JWT-based auth with driver and passenger roles
- **Ride Posting** — Drivers create rides with origin, destination, seats, pricing
- **Ride Requests** — Passengers post ride requests with flexible departure times
- **Bidding System** — Passengers bid on rides; drivers bid on requests. Bid acceptance auto-creates bookings
- **Booking Management** — Direct booking or bid-based booking with seat tracking
- **Ratings & Trust Score** — Post-ride mutual ratings update a cumulative trust score
- **Payment Integration** — Placeholder payment processing with full lifecycle tracking
- **Search & Filtering** — Search rides by origin, destination, date, seats, and max price
- **Google Maps Integration** — Interactive maps for pickup/destination selection, route display, and live ride tracking

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express, PostgreSQL            |
| Auth     | JWT (jsonwebtoken), bcryptjs            |
| Validation | express-validator                     |
| Security | helmet, cors, express-rate-limit        |
| Mobile   | React Native (Expo), React Navigation   |
| Maps     | Google Maps API, react-native-maps, expo-location |
| State    | React Context + useReducer              |
| HTTP     | Axios with interceptors                 |
| Storage  | expo-secure-store for tokens            |

## API Endpoints

### Authentication
| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| POST   | `/api/v1/auth/register`      | No   | Register new user        |
| POST   | `/api/v1/auth/login`         | No   | Login                    |
| GET    | `/api/v1/auth/profile`       | Yes  | Get current user profile |
| PUT    | `/api/v1/auth/profile`       | Yes  | Update profile           |
| PUT    | `/api/v1/auth/driver-profile`| Yes  | Update driver vehicle info |

### Rides
| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| GET    | `/api/v1/rides`              | No   | Search available rides   |
| GET    | `/api/v1/rides/my`           | Yes  | Get driver's own rides   |
| GET    | `/api/v1/rides/:id`          | No   | Get ride details + bids  |
| POST   | `/api/v1/rides`              | Yes  | Post a new ride          |
| PUT    | `/api/v1/rides/:id`          | Yes  | Update ride              |
| POST   | `/api/v1/rides/:id/cancel`   | Yes  | Cancel ride              |

### Ride Requests
| Method | Endpoint                            | Auth | Description               |
|--------|-------------------------------------|------|---------------------------|
| GET    | `/api/v1/ride-requests`             | Yes  | Browse open requests      |
| GET    | `/api/v1/ride-requests/my`          | Yes  | Get my requests           |
| GET    | `/api/v1/ride-requests/:id`         | Yes  | Get request details       |
| POST   | `/api/v1/ride-requests`             | Yes  | Create ride request       |
| POST   | `/api/v1/ride-requests/:id/cancel`  | Yes  | Cancel request            |

### Bids
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| POST   | `/api/v1/bids`                  | Yes  | Place a bid              |
| GET    | `/api/v1/bids/my`               | Yes  | Get my bids              |
| POST   | `/api/v1/bids/:id/respond`      | Yes  | Accept or reject a bid   |
| POST   | `/api/v1/bids/:id/withdraw`     | Yes  | Withdraw a bid           |

### Bookings
| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| POST   | `/api/v1/bookings`                | Yes  | Book a ride directly     |
| GET    | `/api/v1/bookings/my`             | Yes  | Get my bookings          |
| GET    | `/api/v1/bookings/:id`            | Yes  | Get booking details      |
| POST   | `/api/v1/bookings/:id/cancel`     | Yes  | Cancel booking           |
| POST   | `/api/v1/bookings/:id/complete`   | Yes  | Mark booking complete    |
| POST   | `/api/v1/bookings/:id/location`   | Yes  | Update driver location   |
| GET    | `/api/v1/bookings/:id/location`   | Yes  | Get driver location      |
| POST   | `/api/v1/bookings/:id/start`      | Yes  | Start ride (driver only) |

### Directions
| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| GET    | `/api/v1/directions`              | Yes  | Get route directions     |

### Ratings
| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| POST   | `/api/v1/ratings`               | Yes  | Submit a rating          |
| GET    | `/api/v1/ratings/user/:userId`  | No   | Get user's ratings       |

### Payments
| Method | Endpoint                          | Auth | Description              |
|--------|-----------------------------------|------|--------------------------|
| POST   | `/api/v1/payments`                | Yes  | Initiate payment         |
| GET    | `/api/v1/payments/my`             | Yes  | Get my payments          |
| GET    | `/api/v1/payments/:id`            | Yes  | Get payment status       |
| POST   | `/api/v1/payments/:id/complete`   | Yes  | Complete payment         |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`) for mobile development
- Google Maps API key (for maps, directions, and geocoding)

### Backend Setup

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create database
createdb rideshare_marketplace

# 4. Run migrations
npm run migrate

# 5. Seed sample data (optional)
npm run seed

# 6. Start the server
npm run dev
```

The API server starts at `http://localhost:3000`. Health check: `GET /health`.

### Mobile Setup

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Configure Google Maps API key
# Edit mobile/app.json and replace YOUR_GOOGLE_MAPS_API_KEY with your key
# Enable Maps SDK, Directions API, and Geocoding API in Google Cloud Console

# 3. Start Expo
npm start
```

Scan the QR code with Expo Go (iOS/Android) to run the app.

### Seed Credentials

After running `npm run seed`:
- **Driver:** `driver@example.com` / `password123`
- **Passenger:** `passenger@example.com` / `password123`

## Database Schema

The PostgreSQL schema includes 7 tables with full referential integrity:

- **users** — Core user accounts with role (driver/passenger/both) and trust score
- **driver_profiles** — Extended vehicle and license info for drivers
- **rides** — Rides posted by drivers with pricing, seats, and bidding options
- **ride_requests** — Ride requests posted by passengers
- **bids** — Bids on rides or ride requests with accept/reject workflow
- **bookings** — Confirmed ride bookings with seat tracking
- **ratings** — Post-ride mutual ratings that update trust scores
- **payments** — Payment lifecycle tracking (placeholder integration)

## License

MIT

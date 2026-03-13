# Ride Marketplace Database Schema

## Overview

PostgreSQL database schema for a ride marketplace application where drivers post rides and riders can book seats or post requests for drivers to bid on.

## Entity Relationship Diagram (Text)

```
users (1) ──────── (0..1) drivers (1) ──── (0..*) vehicles
  │                          │                        │
  │                          │                        │
  │ (1)                      │ (1)                    │ (1)
  │                          │                        │
  ├──── (0..*) ride_requests │                        │
  │               │          ├──── (0..*) rides ──────┘
  │               │          │        │
  │               │          │        │
  │               └── (0..*) bids ────┘
  │                            │
  │                            │
  ├──── (0..*) bookings ──────┘
  │               │
  │               │
  ├──── (0..*) payments
  │               │
  │               │
  └──── (0..*) ratings
```

## Tables

### 1. `users`
Core user accounts. Every person on the platform has a user record.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | UNIQUE |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| avatar_url | TEXT | |
| role | user_role | NOT NULL, default 'rider' |
| is_verified | BOOLEAN | NOT NULL, default FALSE |
| is_active | BOOLEAN | NOT NULL, default TRUE |
| last_login_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, default NOW() |

### 2. `drivers`
Driver profile linked 1:1 with a user account.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users, UNIQUE |
| license_number | VARCHAR(50) | NOT NULL, UNIQUE |
| license_expiry | DATE | NOT NULL |
| status | driver_status | NOT NULL, default 'pending' |
| rating_avg | NUMERIC(3,2) | CHECK 0-5, default 0.00 |
| total_rides | INTEGER | NOT NULL, default 0 |
| bio | TEXT | |
| is_available | BOOLEAN | NOT NULL, default FALSE |
| current_location | GEOGRAPHY(Point) | PostGIS |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 3. `vehicles`
Vehicles registered by drivers. A driver may have multiple vehicles.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| driver_id | UUID | FK → drivers |
| make | VARCHAR(50) | NOT NULL |
| model | VARCHAR(50) | NOT NULL |
| year | INTEGER | CHECK 1990–2100 |
| color | VARCHAR(30) | NOT NULL |
| license_plate | VARCHAR(20) | NOT NULL, UNIQUE |
| vehicle_type | vehicle_type | default 'sedan' |
| capacity | SMALLINT | CHECK 1–50, default 4 |
| is_active | BOOLEAN | default TRUE |
| insurance_expiry | DATE | |
| photo_url | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 4. `rides`
Rides posted by drivers offering seats on a route.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| driver_id | UUID | FK → drivers |
| vehicle_id | UUID | FK → vehicles |
| origin_location | GEOGRAPHY(Point) | NOT NULL |
| origin_address | TEXT | NOT NULL |
| destination_location | GEOGRAPHY(Point) | NOT NULL |
| destination_address | TEXT | NOT NULL |
| waypoints | JSONB | default '[]' |
| departure_time | TIMESTAMPTZ | NOT NULL |
| estimated_arrival_time | TIMESTAMPTZ | |
| estimated_distance_km | NUMERIC(8,2) | |
| estimated_duration_min | INTEGER | |
| available_seats | SMALLINT | CHECK >= 0 |
| price_per_seat | NUMERIC(10,2) | CHECK >= 0 |
| currency | currency_code | default 'USD' |
| status | ride_status | default 'scheduled' |
| description | TEXT | |
| is_recurring | BOOLEAN | default FALSE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 5. `ride_requests`
Requests from riders looking for a ride on a specific route.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| rider_id | UUID | FK → users |
| origin_location | GEOGRAPHY(Point) | NOT NULL |
| origin_address | TEXT | NOT NULL |
| destination_location | GEOGRAPHY(Point) | NOT NULL |
| destination_address | TEXT | NOT NULL |
| requested_departure_time | TIMESTAMPTZ | NOT NULL |
| flexible_window_min | INTEGER | default 30 |
| seats_needed | SMALLINT | CHECK >= 1 |
| max_price_per_seat | NUMERIC(10,2) | |
| currency | currency_code | default 'USD' |
| status | ride_request_status | default 'open' |
| notes | TEXT | |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 6. `bids`
Driver bids on open ride requests.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| ride_request_id | UUID | FK → ride_requests |
| driver_id | UUID | FK → drivers |
| ride_id | UUID | FK → rides (nullable) |
| proposed_price | NUMERIC(10,2) | CHECK >= 0 |
| currency | currency_code | default 'USD' |
| message | TEXT | |
| status | bid_status | default 'pending' |
| expires_at | TIMESTAMPTZ | |
| responded_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique constraint:** One bid per driver per ride request.

### 7. `bookings`
Confirmed seat reservations linking riders to rides.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| ride_id | UUID | FK → rides |
| rider_id | UUID | FK → users |
| bid_id | UUID | FK → bids (nullable) |
| seats_booked | SMALLINT | CHECK >= 1, default 1 |
| total_price | NUMERIC(10,2) | CHECK >= 0 |
| currency | currency_code | default 'USD' |
| status | booking_status | default 'confirmed' |
| pickup_address | TEXT | |
| dropoff_address | TEXT | |
| booked_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| cancellation_reason | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Unique constraint:** One booking per rider per ride.

### 8. `payments`
Payment transactions for bookings.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| payer_id | UUID | FK → users |
| payee_id | UUID | FK → users |
| amount | NUMERIC(10,2) | CHECK > 0 |
| currency | currency_code | default 'USD' |
| payment_method | payment_method | NOT NULL |
| status | payment_status | default 'pending' |
| transaction_id | VARCHAR(255) | |
| gateway_response | JSONB | |
| platform_fee | NUMERIC(10,2) | default 0.00 |
| driver_payout | NUMERIC(10,2) | |
| paid_at | TIMESTAMPTZ | |
| refunded_at | TIMESTAMPTZ | |
| refund_amount | NUMERIC(10,2) | CHECK <= amount |
| failure_reason | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 9. `ratings`
Post-ride reviews between riders and drivers.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK → bookings |
| rater_id | UUID | FK → users |
| ratee_id | UUID | FK → users |
| score | SMALLINT | CHECK 1–5 |
| comment | TEXT | |
| is_anonymous | BOOLEAN | default FALSE |
| created_at | TIMESTAMPTZ | |

**Unique constraint:** One rating per rater per booking.
**Check constraint:** rater_id != ratee_id (no self-ratings).

## Enum Types

| Type | Values |
|------|--------|
| user_role | rider, driver, admin |
| driver_status | pending, approved, suspended, rejected |
| vehicle_type | sedan, suv, van, hatchback, truck, luxury |
| ride_status | scheduled, in_progress, completed, cancelled |
| ride_request_status | open, matched, closed, cancelled, expired |
| bid_status | pending, accepted, rejected, withdrawn, expired |
| booking_status | confirmed, cancelled_by_rider, cancelled_by_driver, completed, no_show |
| payment_status | pending, processing, completed, failed, refunded, partially_refunded |
| payment_method | credit_card, debit_card, wallet, bank_transfer, cash |
| currency_code | USD, EUR, GBP, INR, CAD, AUD |

## Key Relationships

- **users** 1:1 **drivers** — a user optionally becomes a driver
- **drivers** 1:N **vehicles** — a driver can register multiple vehicles
- **drivers** 1:N **rides** — a driver posts multiple rides
- **rides** N:1 **vehicles** — each ride uses one vehicle
- **users** 1:N **ride_requests** — riders create trip requests
- **ride_requests** 1:N **bids** — drivers bid on requests
- **drivers** 1:N **bids** — a driver places bids
- **rides** 1:N **bookings** — a ride has many seat bookings
- **users** 1:N **bookings** — a rider has many bookings
- **bookings** 1:N **payments** — supports retries and partial refunds
- **bookings** 1:N **ratings** — rider rates driver and vice versa

## Triggers

| Trigger | Table | Purpose |
|---------|-------|---------|
| `trg_*_updated_at` | All mutable tables | Auto-set `updated_at` on UPDATE |
| `trg_ratings_update_driver_avg` | ratings | Recompute `drivers.rating_avg` on new rating |
| `trg_bookings_adjust_seats` | bookings | Decrement/restore `rides.available_seats` |
| `trg_rides_increment_total` | rides | Increment `drivers.total_rides` on completion |

## Views

| View | Purpose |
|------|---------|
| `v_active_rides` | Browse available rides with driver and vehicle info |
| `v_driver_earnings` | Monthly earnings summary per driver |

## Running Migrations

Execute migration files in order:

```bash
for f in migrations/0*[^_down].sql; do
  psql -U your_user -d your_database -f "$f"
done
```

To rollback, run the `*_down.sql` files in reverse order:

```bash
for f in $(ls -r migrations/*_down.sql); do
  psql -U your_user -d your_database -f "$f"
done
```

# Ride Matching Service

Ranks and returns a sorted list of drivers for a passenger's ride request based on a weighted composite score.

## Scoring Criteria

Each driver bid is scored on four dimensions:

| Factor | Weight | Direction |
|---|---|---|
| **Bid Price** | 35% | Lower is better |
| **Driver Rating** | 25% | Higher is better |
| **Distance from Pickup** | 20% | Closer is better |
| **Trust Score** | 20% | Higher is better |

All values are normalised to `[0, 1]` using min-max scaling across the current bid set, then combined into a weighted composite score. Weights are configurable via environment variables or per-request query parameters.

## API

### `GET /api/v1/matching/ride-requests/:requestId`

Returns drivers who have placed pending bids on the given ride request, ranked by composite score.

**Authentication:** Bearer token required. Only the ride request owner can view matches.

**Query Parameters (optional):**

| Parameter | Type | Description |
|---|---|---|
| `wBidPrice` | float (0-1) | Override bid price weight |
| `wDriverRating` | float (0-1) | Override driver rating weight |
| `wDistance` | float (0-1) | Override distance weight |
| `wTrustScore` | float (0-1) | Override trust score weight |

**Response:**

```json
{
  "rideRequest": {
    "id": "uuid",
    "origin": { "address": "...", "lat": 37.77, "lng": -122.41 },
    "destination": { "address": "...", "lat": 37.33, "lng": -121.88 },
    "maxPrice": "50.00",
    "status": "open"
  },
  "matches": [
    {
      "rank": 1,
      "bidId": "uuid",
      "amount": "25.00",
      "driver": {
        "id": "uuid",
        "name": "Jane Smith",
        "rating": 4.8,
        "trustScore": 4.5
      },
      "vehicle": {
        "make": "Toyota",
        "model": "Camry",
        "year": 2022,
        "color": "Silver"
      },
      "distanceKm": 2.34,
      "scores": {
        "bidPrice": 0.85,
        "driverRating": 0.92,
        "distance": 0.78,
        "trustScore": 0.90,
        "composite": 0.87
      }
    }
  ],
  "totalBids": 1,
  "weights": {
    "bidPrice": 0.35,
    "driverRating": 0.25,
    "distance": 0.20,
    "trustScore": 0.20
  }
}
```

## Running Tests

```bash
cd backend
npm install
npm test
```

## Configuration

Copy `.env.example` to `.env` and fill in the values. Matching weights can be tuned via the `MATCH_WEIGHT_*` environment variables.

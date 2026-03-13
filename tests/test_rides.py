from datetime import datetime, timedelta, timezone

import pytest

FUTURE_TIME = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
PAST_TIME = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()


def _ride_payload(**overrides):
    base = {
        "driver_id": "driver-1",
        "origin": "New York",
        "destination": "Boston",
        "departure_time": FUTURE_TIME,
        "available_seats": 3,
        "price_per_seat": 25.00,
    }
    base.update(overrides)
    return base


class TestCreateRide:
    def test_create_ride_success(self, client):
        resp = client.post("/api/rides/", json=_ride_payload())
        assert resp.status_code == 201
        data = resp.json()
        assert data["driver_id"] == "driver-1"
        assert data["origin"] == "New York"
        assert data["destination"] == "Boston"
        assert data["available_seats"] == 3
        assert data["price_per_seat"] == 25.00
        assert data["status"] == "active"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_ride_missing_fields(self, client):
        resp = client.post("/api/rides/", json={})
        assert resp.status_code == 422

    def test_create_ride_zero_seats(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(available_seats=0))
        assert resp.status_code == 422

    def test_create_ride_negative_price(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(price_per_seat=-5))
        assert resp.status_code == 422

    def test_create_ride_zero_price(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(price_per_seat=0))
        assert resp.status_code == 422

    def test_create_ride_past_departure(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(departure_time=PAST_TIME))
        assert resp.status_code == 422

    def test_create_ride_empty_origin(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(origin=""))
        assert resp.status_code == 422

    def test_create_ride_empty_destination(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(destination=""))
        assert resp.status_code == 422

    def test_create_ride_empty_driver_id(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(driver_id=""))
        assert resp.status_code == 422

    def test_create_ride_excessive_seats(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(available_seats=51))
        assert resp.status_code == 422

    def test_create_ride_excessive_price(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(price_per_seat=100001))
        assert resp.status_code == 422

    def test_create_ride_strips_whitespace(self, client):
        resp = client.post("/api/rides/", json=_ride_payload(origin="  Chicago  ", destination="  Detroit  "))
        assert resp.status_code == 201
        data = resp.json()
        assert data["origin"] == "Chicago"
        assert data["destination"] == "Detroit"


class TestGetRide:
    def test_get_ride_success(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.get(f"/api/rides/{ride_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == ride_id

    def test_get_ride_not_found(self, client):
        resp = client.get("/api/rides/9999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Ride not found"


class TestListRides:
    def test_list_rides_empty(self, client):
        resp = client.get("/api/rides/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["rides"] == []
        assert data["total"] == 0

    def test_list_rides_returns_active_by_default(self, client):
        client.post("/api/rides/", json=_ride_payload())
        client.post("/api/rides/", json=_ride_payload(origin="Chicago"))

        resp = client.get("/api/rides/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["rides"]) == 2

    def test_list_rides_filter_by_origin(self, client):
        client.post("/api/rides/", json=_ride_payload(origin="New York"))
        client.post("/api/rides/", json=_ride_payload(origin="Chicago"))

        resp = client.get("/api/rides/", params={"origin": "Chicago"})
        data = resp.json()
        assert data["total"] == 1
        assert data["rides"][0]["origin"] == "Chicago"

    def test_list_rides_filter_by_destination(self, client):
        client.post("/api/rides/", json=_ride_payload(destination="Boston"))
        client.post("/api/rides/", json=_ride_payload(destination="Detroit"))

        resp = client.get("/api/rides/", params={"destination": "Detroit"})
        data = resp.json()
        assert data["total"] == 1
        assert data["rides"][0]["destination"] == "Detroit"

    def test_list_rides_filter_by_min_seats(self, client):
        client.post("/api/rides/", json=_ride_payload(available_seats=2))
        client.post("/api/rides/", json=_ride_payload(available_seats=4))

        resp = client.get("/api/rides/", params={"min_seats": 3})
        data = resp.json()
        assert data["total"] == 1
        assert data["rides"][0]["available_seats"] == 4

    def test_list_rides_filter_by_max_price(self, client):
        client.post("/api/rides/", json=_ride_payload(price_per_seat=10))
        client.post("/api/rides/", json=_ride_payload(price_per_seat=30))

        resp = client.get("/api/rides/", params={"max_price": 15})
        data = resp.json()
        assert data["total"] == 1
        assert data["rides"][0]["price_per_seat"] == 10

    def test_list_rides_pagination(self, client):
        for i in range(5):
            client.post("/api/rides/", json=_ride_payload(origin=f"City-{i}"))

        resp = client.get("/api/rides/", params={"page": 1, "per_page": 2})
        data = resp.json()
        assert data["total"] == 5
        assert len(data["rides"]) == 2
        assert data["page"] == 1
        assert data["per_page"] == 2

        resp2 = client.get("/api/rides/", params={"page": 3, "per_page": 2})
        data2 = resp2.json()
        assert len(data2["rides"]) == 1


class TestUpdateRide:
    def test_update_ride_success(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "driver-1"},
            json={"origin": "Philadelphia", "available_seats": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["origin"] == "Philadelphia"
        assert data["available_seats"] == 5
        assert data["destination"] == "Boston"

    def test_update_ride_not_found(self, client):
        resp = client.put(
            "/api/rides/9999",
            params={"driver_id": "driver-1"},
            json={"origin": "Philadelphia"},
        )
        assert resp.status_code == 404

    def test_update_ride_wrong_driver(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "another-driver"},
            json={"origin": "Philadelphia"},
        )
        assert resp.status_code == 403

    def test_update_ride_invalid_seats(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "driver-1"},
            json={"available_seats": 0},
        )
        assert resp.status_code == 422

    def test_update_ride_status_to_cancelled(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "driver-1"},
            json={"status": "cancelled"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_update_cancelled_ride_fails(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "driver-1"},
            json={"status": "cancelled"},
        )

        resp = client.put(
            f"/api/rides/{ride_id}",
            params={"driver_id": "driver-1"},
            json={"origin": "Philadelphia"},
        )
        assert resp.status_code == 400


class TestDeleteRide:
    def test_delete_ride_success(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.delete(f"/api/rides/{ride_id}", params={"driver_id": "driver-1"})
        assert resp.status_code == 204

        get_resp = client.get(f"/api/rides/{ride_id}")
        assert get_resp.status_code == 404

    def test_delete_ride_not_found(self, client):
        resp = client.delete("/api/rides/9999", params={"driver_id": "driver-1"})
        assert resp.status_code == 404

    def test_delete_ride_wrong_driver(self, client):
        create_resp = client.post("/api/rides/", json=_ride_payload())
        ride_id = create_resp.json()["id"]

        resp = client.delete(f"/api/rides/{ride_id}", params={"driver_id": "another-driver"})
        assert resp.status_code == 403


class TestHealthCheck:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

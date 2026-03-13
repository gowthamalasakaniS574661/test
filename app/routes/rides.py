from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ride, RideStatus
from app.schemas import RideCreate, RideListResponse, RideResponse, RideUpdate

router = APIRouter(prefix="/api/rides", tags=["rides"])


@router.post("/", response_model=RideResponse, status_code=201)
def create_ride(ride_data: RideCreate, db: Session = Depends(get_db)) -> Ride:
    ride = Ride(
        driver_id=ride_data.driver_id,
        origin=ride_data.origin,
        destination=ride_data.destination,
        departure_time=ride_data.departure_time,
        available_seats=ride_data.available_seats,
        price_per_seat=ride_data.price_per_seat,
        status=RideStatus.ACTIVE,
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.get("/", response_model=RideListResponse)
def list_rides(
    origin: str | None = Query(None, description="Filter by origin"),
    destination: str | None = Query(None, description="Filter by destination"),
    min_seats: int | None = Query(None, ge=1, description="Minimum available seats"),
    max_price: float | None = Query(None, gt=0, description="Maximum price per seat"),
    status: RideStatus | None = Query(None, description="Filter by ride status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Ride)

    if origin:
        query = query.filter(Ride.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Ride.destination.ilike(f"%{destination}%"))
    if min_seats is not None:
        query = query.filter(Ride.available_seats >= min_seats)
    if max_price is not None:
        query = query.filter(Ride.price_per_seat <= max_price)
    if status:
        query = query.filter(Ride.status == status)
    else:
        query = query.filter(Ride.status == RideStatus.ACTIVE)

    total = query.with_entities(func.count(Ride.id)).scalar()
    rides = (
        query.order_by(Ride.departure_time.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {"rides": rides, "total": total, "page": page, "per_page": per_page}


@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(ride_id: int, db: Session = Depends(get_db)) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


@router.put("/{ride_id}", response_model=RideResponse)
def update_ride(
    ride_id: int,
    ride_data: RideUpdate,
    driver_id: str = Query(..., description="ID of the driver making the update"),
    db: Session = Depends(get_db),
) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.driver_id != driver_id:
        raise HTTPException(status_code=403, detail="Only the ride owner can update this ride")

    if ride.status != RideStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Cannot update a non-active ride")

    update_fields = ride_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(ride, field, value)

    ride.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ride)
    return ride


@router.delete("/{ride_id}", status_code=204)
def delete_ride(
    ride_id: int,
    driver_id: str = Query(..., description="ID of the driver deleting the ride"),
    db: Session = Depends(get_db),
) -> None:
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.driver_id != driver_id:
        raise HTTPException(status_code=403, detail="Only the ride owner can delete this ride")

    db.delete(ride)
    db.commit()

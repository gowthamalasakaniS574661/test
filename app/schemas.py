from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator

from app.models import RideStatus


class RideCreate(BaseModel):
    driver_id: str = Field(..., min_length=1, max_length=255, description="ID of the driver posting the ride")
    origin: str = Field(..., min_length=1, max_length=500, description="Starting location")
    destination: str = Field(..., min_length=1, max_length=500, description="Ending location")
    departure_time: datetime = Field(..., description="Departure date and time (ISO 8601)")
    available_seats: int = Field(..., ge=1, le=50, description="Number of available seats")
    price_per_seat: float = Field(..., gt=0, le=100000, description="Price per seat")

    @field_validator("departure_time")
    @classmethod
    def departure_must_be_in_future(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError("Departure time must be in the future")
        return v

    @field_validator("origin")
    @classmethod
    def origin_stripped(cls, v: str) -> str:
        return v.strip()

    @field_validator("destination")
    @classmethod
    def destination_stripped(cls, v: str) -> str:
        return v.strip()


class RideUpdate(BaseModel):
    origin: str | None = Field(None, min_length=1, max_length=500)
    destination: str | None = Field(None, min_length=1, max_length=500)
    departure_time: datetime | None = Field(None)
    available_seats: int | None = Field(None, ge=1, le=50)
    price_per_seat: float | None = Field(None, gt=0, le=100000)
    status: RideStatus | None = None

    @field_validator("departure_time")
    @classmethod
    def departure_must_be_in_future(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return v
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError("Departure time must be in the future")
        return v

    @field_validator("origin")
    @classmethod
    def origin_stripped(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("destination")
    @classmethod
    def destination_stripped(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class RideResponse(BaseModel):
    id: int
    driver_id: str
    origin: str
    destination: str
    departure_time: datetime
    available_seats: int
    price_per_seat: float
    status: RideStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RideListResponse(BaseModel):
    rides: list[RideResponse]
    total: int
    page: int
    per_page: int

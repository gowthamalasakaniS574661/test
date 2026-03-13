from fastapi import FastAPI

from app.database import Base, engine
from app.routes.rides import router as rides_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ride Posting API",
    description="API for drivers to post rides and passengers to browse available rides.",
    version="1.0.0",
)

app.include_router(rides_router)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}

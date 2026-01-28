import os
import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

# Load env (supervisor doesn't automatically load it)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URL = os.environ.get("MONGO_URL")
if not MONGO_URL:
    # Keep as explicit error so the environment is configured correctly.
    raise RuntimeError("MONGO_URL is not set. Please configure it in /app/backend/.env")

client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get("MONGO_DB_NAME", "parcel_app")]

app = FastAPI(title="Parcel Tracking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


ParcelStatus = Literal[
    "Pending",
    "Accepted",
    "Picked Up",
    "In Transit",
    "Arrived",
    "Delivered",
    "Cancelled",
    "Issue",
]

TrackingEventType = ParcelStatus


class LatLng(BaseModel):
    lat: float
    lng: float


class ParcelCreate(BaseModel):
    origin: str
    destination: str
    originLat: Optional[float] = None
    originLng: Optional[float] = None
    destinationLat: Optional[float] = None
    destinationLng: Optional[float] = None

    senderId: str

    receiverName: Optional[str] = None
    receiverPhone: Optional[str] = None
    receiverEmail: Optional[str] = None
    receiverLat: Optional[float] = None
    receiverLng: Optional[float] = None

    # money/metadata kept minimal for MVP
    compensation: Optional[float] = None


class ParcelUpdate(BaseModel):
    manualTrackingEnabled: Optional[bool] = None
    liveTrackingEnabled: Optional[bool] = None

    # allow status updates through tracking events; keep here for admin tooling
    status: Optional[ParcelStatus] = None


class ParcelOut(BaseModel):
    id: str
    origin: str
    destination: str
    originLat: Optional[float] = None
    originLng: Optional[float] = None
    destinationLat: Optional[float] = None
    destinationLng: Optional[float] = None

    senderId: str
    transporterId: Optional[str] = None

    receiverName: Optional[str] = None
    receiverPhone: Optional[str] = None
    receiverEmail: Optional[str] = None
    receiverLat: Optional[float] = None
    receiverLng: Optional[float] = None

    status: ParcelStatus

    manualTrackingEnabled: bool
    liveTrackingEnabled: bool

    createdAt: datetime
    updatedAt: datetime


class ParcelAcceptBody(BaseModel):
    transporterId: str


class TrackingEventCreate(BaseModel):
    eventType: TrackingEventType
    note: Optional[str] = None
    createdByUserId: str


class TrackingEventOut(BaseModel):
    id: str
    parcelId: str
    eventType: TrackingEventType
    note: Optional[str] = None
    createdByUserId: str
    createdAt: datetime


class CarrierLocationCreate(BaseModel):
    lat: float
    lng: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None


class CarrierLocationOut(BaseModel):
    id: str
    parcelId: str
    carrierId: str
    lat: float
    lng: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None
    timestamp: datetime



class ReceiverLocationCreate(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = None


class ReceiverLocationOut(BaseModel):
    id: str
    parcelId: str
    receiverId: str
    lat: float
    lng: float
    accuracy: Optional[float] = None
    timestamp: datetime


def _now() -> datetime:
    return datetime.utcnow()


async def _get_parcel_or_404(parcel_id: str) -> dict[str, Any]:
    parcel = await db.parcels.find_one({"id": parcel_id})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel


async def _create_tracking_event(
    parcel_id: str,
    event_type: TrackingEventType,
    created_by_user_id: str,
    note: Optional[str] = None,
) -> dict[str, Any]:
    event = {
        "id": str(uuid.uuid4()),
        "parcelId": parcel_id,
        "eventType": event_type,
        "note": note,
        "createdByUserId": created_by_user_id,
        "createdAt": _now(),
    }
    await db.parcel_tracking_events.insert_one(event)
    return event


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.post("/api/parcels", response_model=ParcelOut)
async def create_parcel(body: ParcelCreate):
    now = _now()
    parcel = {
        "id": str(uuid.uuid4()),
        "origin": body.origin,
        "destination": body.destination,
        "originLat": body.originLat,
        "originLng": body.originLng,
        "destinationLat": body.destinationLat,
        "destinationLng": body.destinationLng,
        "senderId": body.senderId,
        "transporterId": None,
        "receiverName": body.receiverName,
        "receiverPhone": body.receiverPhone,
        "receiverEmail": body.receiverEmail,
        "receiverLat": body.receiverLat,
        "receiverLng": body.receiverLng,
        "compensation": body.compensation,
        "status": "Pending",
        "manualTrackingEnabled": True,
        "liveTrackingEnabled": False,
        "createdAt": now,
        "updatedAt": now,
    }
    await db.parcels.insert_one(parcel)
    return parcel


@app.get("/api/parcels", response_model=list[ParcelOut])
async def list_parcels():
    docs = await db.parcels.find({}).sort("createdAt", -1).to_list(length=200)
    return docs


@app.get("/api/parcels/{parcel_id}", response_model=ParcelOut)
async def get_parcel(parcel_id: str):
    return await _get_parcel_or_404(parcel_id)


@app.patch("/api/parcels/{parcel_id}", response_model=ParcelOut)
async def update_parcel(parcel_id: str, body: ParcelUpdate):
    existing = await _get_parcel_or_404(parcel_id)

    updates: dict[str, Any] = {}
    if body.manualTrackingEnabled is not None:
        updates["manualTrackingEnabled"] = body.manualTrackingEnabled
    if body.liveTrackingEnabled is not None:
        updates["liveTrackingEnabled"] = body.liveTrackingEnabled
    if body.status is not None:
        updates["status"] = body.status

    if not updates:
        return existing

    updates["updatedAt"] = _now()

    await db.parcels.update_one({"id": parcel_id}, {"$set": updates})
    return await _get_parcel_or_404(parcel_id)


@app.patch("/api/parcels/{parcel_id}/accept", response_model=ParcelOut)
async def accept_parcel(parcel_id: str, body: ParcelAcceptBody):
    parcel = await _get_parcel_or_404(parcel_id)

    if parcel.get("transporterId"):
        raise HTTPException(status_code=409, detail="Parcel already accepted")

    now = _now()
    await db.parcels.update_one(
        {"id": parcel_id},
        {
            "$set": {
                "transporterId": body.transporterId,
                "status": "Accepted",
                "updatedAt": now,
            }
        },
    )

    await _create_tracking_event(
        parcel_id=parcel_id,
        event_type="Accepted",
        created_by_user_id=body.transporterId,
        note="Parcel accepted by carrier",
    )

    return await _get_parcel_or_404(parcel_id)


@app.get("/api/parcels/{parcel_id}/tracking-events", response_model=list[TrackingEventOut])
async def list_tracking_events(parcel_id: str):
    await _get_parcel_or_404(parcel_id)
    docs = await db.parcel_tracking_events.find({"parcelId": parcel_id}).sort("createdAt", 1).to_list(length=500)
    return docs


@app.post("/api/parcels/{parcel_id}/tracking-events", response_model=TrackingEventOut)
async def create_tracking_event(parcel_id: str, body: TrackingEventCreate):
    parcel = await _get_parcel_or_404(parcel_id)

    if not parcel.get("manualTrackingEnabled", True):
        raise HTTPException(status_code=403, detail="Manual tracking is disabled for this parcel")

    # allow sender or transporter to post events (as requested)
    allowed = {parcel.get("senderId"), parcel.get("transporterId")}
    if body.createdByUserId not in allowed:
        raise HTTPException(status_code=403, detail="Not allowed to post tracking events for this parcel")

    event = await _create_tracking_event(
        parcel_id=parcel_id,
        event_type=body.eventType,
        created_by_user_id=body.createdByUserId,
        note=body.note,
    )

    # keep parcel.status in sync for primary state
    await db.parcels.update_one(
        {"id": parcel_id},
        {"$set": {"status": body.eventType, "updatedAt": _now()}},
    )

    return event


@app.get("/api/parcels/{parcel_id}/carrier-location", response_model=Optional[CarrierLocationOut])
async def get_carrier_location(parcel_id: str):
    await _get_parcel_or_404(parcel_id)
    doc = await db.carrier_locations.find({"parcelId": parcel_id}).sort("timestamp", -1).limit(1).to_list(length=1)
    return doc[0] if doc else None


@app.post("/api/parcels/{parcel_id}/carrier-location", response_model=CarrierLocationOut)
async def post_carrier_location(
    parcel_id: str,
    body: CarrierLocationCreate,
    carrierId: str = Query(..., description="Carrier user id"),
):
    parcel = await _get_parcel_or_404(parcel_id)

    if not parcel.get("liveTrackingEnabled", False):
        raise HTTPException(status_code=403, detail="Live GPS tracking is disabled for this parcel")

    if parcel.get("transporterId") != carrierId:
        raise HTTPException(status_code=403, detail="Only the accepted carrier can post location")

    loc = {
        "id": str(uuid.uuid4()),
        "parcelId": parcel_id,
        "carrierId": carrierId,
        "lat": body.lat,
        "lng": body.lng,
        "heading": body.heading,
        "speed": body.speed,
        "accuracy": body.accuracy,
        "timestamp": _now(),
    }
    await db.carrier_locations.insert_one(loc)
    return loc


@app.get("/api/parcels/{parcel_id}/receiver-location", response_model=Optional[ReceiverLocationOut])
async def get_receiver_location(parcel_id: str):
    await _get_parcel_or_404(parcel_id)
    doc = await db.receiver_locations.find({"parcelId": parcel_id}).sort("timestamp", -1).limit(1).to_list(length=1)
    return doc[0] if doc else None


@app.post("/api/parcels/{parcel_id}/receiver-location", response_model=ReceiverLocationOut)
async def post_receiver_location(
    parcel_id: str,
    body: ReceiverLocationCreate,
    receiverId: str = Query(..., description="Receiver user id"),
):
    parcel = await _get_parcel_or_404(parcel_id)

    if parcel.get("receiverId") and parcel.get("receiverId") != receiverId:
        raise HTTPException(status_code=403, detail="Only the parcel receiver can post receiver location")

    loc = {
        "id": str(uuid.uuid4()),
        "parcelId": parcel_id,
        "receiverId": receiverId,
        "lat": body.lat,
        "lng": body.lng,
        "accuracy": body.accuracy,
        "timestamp": _now(),
    }
    await db.receiver_locations.insert_one(loc)
    return loc

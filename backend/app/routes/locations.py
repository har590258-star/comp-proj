from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.location_service import location_service
from app.schemas.location import CurrentLocationOut, LocationLogRequest
from app.db.mongodb import get_collection
from datetime import datetime

router = APIRouter(prefix="/locations", tags=["Location Tracking"])

@router.get("/team")
async def get_team_locations():
    return await location_service.get_team_locations()

@router.get("/current/{employee_id}", response_model=CurrentLocationOut)
async def get_current_location(employee_id: str):
    return await location_service.get_current_location(employee_id)

@router.get("/history/{employee_id}")
async def get_location_history(employee_id: str, limit: int = Query(50)):
    return await location_service.get_location_history(employee_id, limit)

@router.post("/log")
async def log_location(req: LocationLogRequest):
    locations_col = get_collection("locations")
    employees_col = get_collection("employees")
    now = datetime.now()
    doc = {
        "employeeId": req.employeeId,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "accuracy": req.accuracy,
        "siteId": req.siteId,
        "timestamp": now.isoformat(),
        "batteryLevel": req.batteryLevel,
        "speed": req.speed
    }
    await locations_col.insert_one(doc)
    
    # Update employee's last active telemetry in employees collection
    await employees_col.update_one(
        {"employeeId": req.employeeId},
        {"$set": {
            "lastSeen": now.isoformat(),
            "lastLatitude": req.latitude,
            "lastLongitude": req.longitude,
            "lastBatteryLevel": req.batteryLevel,
            "lastSpeed": req.speed
        }}
    )
    return {"success": True, "timestamp": now.isoformat()}

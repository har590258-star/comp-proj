from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.db.mongodb import get_collection
from app.schemas.settings import AttendanceSettingsSchema, SystemSettingsOut

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SystemSettingsOut)
async def get_settings():
    settings_col = get_collection("settings")
    doc = await settings_col.find_one({"id": "app_settings"})
    if not doc:
        default_settings = AttendanceSettingsSchema()
        return SystemSettingsOut(
            settings=default_settings,
            updatedAt=datetime.utcnow().isoformat(),
            updatedBy="System Default"
        )
    return SystemSettingsOut(
        settings=AttendanceSettingsSchema(**doc.get("settings", {})),
        updatedAt=doc.get("updatedAt", datetime.utcnow().isoformat()),
        updatedBy=doc.get("updatedBy", "Admin")
    )

@router.put("", response_model=SystemSettingsOut)
async def update_settings(new_settings: AttendanceSettingsSchema):
    settings_col = get_collection("settings")
    now_str = datetime.utcnow().isoformat()
    update_doc = {
        "settings": new_settings.dict(),
        "updatedAt": now_str,
        "updatedBy": "Admin"
    }
    await settings_col.update_one({"id": "app_settings"}, {"$set": update_doc}, upsert=True)
    return SystemSettingsOut(
        settings=new_settings,
        updatedAt=now_str,
        updatedBy="Admin"
    )

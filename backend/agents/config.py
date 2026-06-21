from fastapi import APIRouter
from pydantic import BaseModel
from db.database import set_config, get_config

router = APIRouter(prefix="/config")


class ApiKeyRequest(BaseModel):
    key: str


@router.post("/apikey")
async def set_api_key(req: ApiKeyRequest):
    if not req.key.startswith("AIza"):
        return {"error": "Invalid Google API key format (should start with AIza)"}
    set_config("google_api_key", req.key)
    return {"ok": True}


@router.get("/apikey/status")
async def api_key_status():
    key = get_config("google_api_key")
    return {"set": bool(key), "prefix": key[:12] + "..." if key else None}

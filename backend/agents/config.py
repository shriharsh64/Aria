from fastapi import APIRouter
from pydantic import BaseModel
from db.database import set_config, get_config

router = APIRouter(prefix="/config")


class ApiKeyRequest(BaseModel):
    key: str


@router.post("/apikey")
async def set_api_key(req: ApiKeyRequest):
    if not req.key.startswith("sk-ant-"):
        return {"error": "Invalid Anthropic API key format"}
    set_config("anthropic_api_key", req.key)
    return {"ok": True}


@router.get("/apikey/status")
async def api_key_status():
    key = get_config("anthropic_api_key")
    return {"set": bool(key), "prefix": key[:12] + "..." if key else None}

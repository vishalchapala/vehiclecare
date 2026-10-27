"""VehicleCare dispatch service (FastAPI).

The Node.js server calls this service to rank available providers for a new request.
It is private: every call must carry the secret in the X-Internal-Key header.
If this service is down, the Node.js server falls back to its own least-busy rule.
"""
import os
import secrets
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from dispatch_logic import rank_providers

app = FastAPI(title="VehicleCare Dispatch Service", version="1.0.0")


class Provider(BaseModel):
    id: str = Field(..., max_length=64)
    name: str = Field("", max_length=100)
    active_jobs: int = Field(0, ge=0, le=1000)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)


class RankRequest(BaseModel):
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    providers: List[Provider] = Field(..., max_length=500)


def require_key(supplied: Optional[str]) -> None:
    expected = os.environ.get("INTERNAL_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Service is not configured")
    if not supplied or not secrets.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"success": True, "message": "VehicleCare dispatch service is running"}


@app.post("/rank")
def rank(body: RankRequest, x_internal_key: Optional[str] = Header(default=None)):
    require_key(x_internal_key)
    ranking = rank_providers(body.lat, body.lng, [p.model_dump() for p in body.providers])
    return {"success": True, "ranking": ranking}

import argparse
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from agents.orchestrator import router as agent_router
from agents.project import router as project_router
from agents.research import router as research_router
from agents.files import router as files_router
from agents.config import router as config_router

app = FastAPI(title="ARIA Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)
app.include_router(project_router)
app.include_router(research_router)
app.include_router(files_router)
app.include_router(config_router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "ARIA"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    uvicorn.run("main:app", host="127.0.0.1", port=args.port, log_level="warning")

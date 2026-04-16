import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import test_connection
from app.api.v1.equipment import router as equipment_router
from app.api.v1.downtimes import router as downtimes_router
from app.api.v1.hypotheses import router as hypotheses_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.enterprises import router as enterprises_router
from app.api.v1.users import router as users_router
from app.api.v1.auth import router as auth_router

app = FastAPI()

origins = [
    "http://localhost:5174",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        if await test_connection():
            logger.info("Database connected successfully")
        else:
            logger.error("Database connection failed")
    except Exception as e:
        logger.exception(f"Startup error: {e}")

app.include_router(equipment_router)
app.include_router(downtimes_router)
app.include_router(hypotheses_router)
app.include_router(analytics_router)
app.include_router(enterprises_router)
app.include_router(users_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message":"Sampo Smart AI Agent"}
from fastapi import FastAPI

from app.database import test_connection
from app.api.v1.equipment import router as equipment_router
from app.api.v1.downtimes import router as downtimes_router
from app.api.v1.hypotheses import router as hypotheses_router

app = FastAPI()

@app.on_event("startup")
async def startup():
    try:
        if await test_connection():
            print("BD is connected!")
        else:
            print("It's error (")
    except Exception as e:
        print(f"Error: {e}")

app.include_router(equipment_router)
app.include_router(downtimes_router)
app.include_router(hypotheses_router)

@app.get("/")
def root():
    return {"message":"Sampo Smart AI Agent"}
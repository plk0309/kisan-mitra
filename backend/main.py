from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chat import router as chat_router
from app.routers.diagnose import router as diagnose_router
from app.routers.prices import router as prices_router

app = FastAPI(
    title="Kisan Mitra API",
    description="AI agriculture assistant for Indian farmers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(diagnose_router)
app.include_router(prices_router)

@app.get("/")
def root():
    return {"message": "Kisan Mitra API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
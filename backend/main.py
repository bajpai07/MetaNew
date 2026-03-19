from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import tryon
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="MetaShop VTON API", 
    version="1.0.0",
    description="Backend API for the Virtual Try-On functionality"
)

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # React default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the uploads directory so the frontend can access the processed images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(tryon.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "MetaShop VTON Backend is running. View docs at /docs"}

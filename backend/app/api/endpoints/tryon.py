from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict
import shutil
import os
import uuid
import asyncio

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/tryon")
async def process_tryon(
    user_image: UploadFile = File(...),
    clothing_image: UploadFile = File(...)
) -> Dict[str, str]:
    """
    Accepts a user image and a clothing image.
    Validates the files, saves them, and (eventually) sends them to the ML service.
    """
    # 1. Validate files
    if not user_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="User image must be an image file")
    if not clothing_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Clothing image must be an image file")

    # 2. Save uploaded files locally (or to S3 in production)
    task_id = str(uuid.uuid4())
    user_img_filename = f"{task_id}_user_{user_image.filename}"
    cloth_img_filename = f"{task_id}_cloth_{clothing_image.filename}"
    
    user_img_path = os.path.join(UPLOAD_DIR, user_img_filename)
    cloth_img_path = os.path.join(UPLOAD_DIR, cloth_img_filename)

    try:
        with open(user_img_path, "wb") as buffer:
            shutil.copyfileobj(user_image.file, buffer)
        with open(cloth_img_path, "wb") as buffer:
            shutil.copyfileobj(clothing_image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save images: {str(e)}")

    # 3. Simulate processing delay (Scaffolding for real Async ML call)
    # TODO: In Phase 3, we will call the real ML service here.
    await asyncio.sleep(2)
    
    # Placeholder: return the user image as the "result" for now to test the complete loop
    result_image_url = f"http://localhost:8000/uploads/{user_img_filename}"

    return {
        "status": "success",
        "task_id": task_id,
        "result_url": result_image_url,
        "message": "Images successfully processed. Real ML integration pending."
    }

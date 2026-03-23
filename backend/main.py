import os
import uuid
import shutil
import traceback
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import JobStatus, JobStatusEnum, HealthResponse
from ml.pipeline import TryOnPipeline
from ml.exceptions import TryOnServiceUnavailableError, InvalidImageError, ImageTooLargeError

app = FastAPI(title="MetaShop VTON API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/uploads/"
RESULTS_DIR = "/tmp/results/"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

def validate_image(file: UploadFile) -> None:
    if not file.filename:
        raise InvalidImageError("Empty filename provided.")
        
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidImageError(f"Invalid file type: {ext}. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
        
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ImageTooLargeError(f"File too large. Maximum size allowed is {MAX_FILE_SIZE_MB}MB.")

@app.get("/api/v1/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")

@app.post("/api/v1/try-on", status_code=status.HTTP_202_ACCEPTED, response_model=JobStatus)
def try_on(user_image: UploadFile = File(...), garment_image: UploadFile = File(...)) -> JobStatus:
    try:
        validate_image(user_image)
        validate_image(garment_image)
    except (InvalidImageError, ImageTooLargeError) as e:
        raise HTTPException(**e.to_http_response())
    
    job_id = str(uuid.uuid4())
    
    user_image_path = os.path.join(UPLOAD_DIR, f"{job_id}_user_{user_image.filename}")
    garment_image_path = os.path.join(UPLOAD_DIR, f"{job_id}_garment_{garment_image.filename}")
    
    with open(user_image_path, "wb") as buffer:
        shutil.copyfileobj(user_image.file, buffer)
        
    with open(garment_image_path, "wb") as buffer:
        shutil.copyfileobj(garment_image.file, buffer)
        
    try:
        pipeline = TryOnPipeline()
        result_path = pipeline.run(user_image_path, garment_image_path)
        
        # Link the generated Gradio pipeline file to our explicit job_id
        final_result_path = os.path.join(RESULTS_DIR, f"{job_id}.jpg")
        shutil.move(result_path, final_result_path)
        
        return JobStatus(
            job_id=job_id,
            status=JobStatusEnum.done,
            created_at=datetime.now(timezone.utc),
            result_url=f"/api/v1/result/{job_id}"
        )
        
    except TryOnServiceUnavailableError as e:
        raise HTTPException(**e.to_http_response())
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"message": "Internal processing error", "job_id": job_id, "error": str(e)}
        )

@app.get("/api/v1/status/{job_id}", response_model=JobStatus)
def get_status(job_id: str) -> JobStatus:
    # Phase 2 mock processing read. In Phase 3, this checks Celery.
    final_result_path = os.path.join(RESULTS_DIR, f"{job_id}.jpg")
    if os.path.exists(final_result_path):
        return JobStatus(
            job_id=job_id,
            status=JobStatusEnum.done,
            created_at=datetime.now(timezone.utc),
            result_url=f"/api/v1/result/{job_id}"
        )
    
    return JobStatus(
        job_id=job_id,
        status=JobStatusEnum.processing,
        created_at=datetime.now(timezone.utc)
    )

@app.get("/api/v1/result/{job_id}")
def get_result(job_id: str):
    file_path = os.path.join(RESULTS_DIR, f"{job_id}.jpg")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result not found or expired")
    return FileResponse(file_path, media_type="image/jpeg")

from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class JobStatusEnum(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"

class JobStatus(BaseModel):
    job_id: str
    status: JobStatusEnum
    created_at: datetime
    result_url: Optional[str] = None
    error_message: Optional[str] = None

class HealthResponse(BaseModel):
    status: str

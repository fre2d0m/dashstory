"""
Narration Router - 解读生成
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import structlog

from app.core.security import get_current_user
from app.core.config import settings
from app.schemas.narration import (
    NarrationRequest,
    NarrationResponse,
    NarrationStatus,
    NarrationResult,
    JobStatus
)
from app.services.narration_service import NarrationService
from app.services.tts_service import TTSService

router = APIRouter()
logger = structlog.get_logger()


# 服务实例
narration_service = NarrationService()
tts_service = TTSService()

# 任务状态存储（生产环境应使用Redis）
job_store = {}


@router.post("/play", response_model=NarrationResponse)
async def generate_narration(
    request: NarrationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    请求生成解读语音
    
    接收Panel数据，生成文字解读并合成语音
    """
    job_id = str(uuid.uuid4())
    org_id = current_user.get("org_id")
    
    logger.info(
        "Narration request received",
        job_id=job_id,
        org_id=org_id,
        panel_count=len(request.panels),
        voice_id=request.voiceId
    )
    
    try:
        # 生成文字解读
        narration_result = await narration_service.generate_narration(
            panels=[p.model_dump() for p in request.panels],
            language=request.language
        )
        
        # 合成语音
        audio_result = await tts_service.synthesize(
            text=narration_result.summary,
            voice_id=request.voiceId,
            language=request.language
        )
        
        # 存储任务状态
        job_store[job_id] = {
            "status": JobStatus.SUCCEEDED,
            "result": narration_result,
            "audio_url": audio_result.get("audio_url"),
            "duration": audio_result.get("duration"),
            "created_at": datetime.utcnow(),
            "completed_at": datetime.utcnow()
        }
        
        logger.info(
            "Narration generated successfully",
            job_id=job_id,
            duration=audio_result.get("duration")
        )
        
        return NarrationResponse(
            jobId=job_id,
            status=JobStatus.SUCCEEDED,
            audioUrl=audio_result.get("audio_url"),
            text=narration_result.summary,
            result=narration_result,
            duration=audio_result.get("duration")
        )
        
    except Exception as e:
        logger.error(
            "Narration generation failed",
            job_id=job_id,
            error=str(e)
        )
        
        job_store[job_id] = {
            "status": JobStatus.FAILED,
            "error": str(e),
            "created_at": datetime.utcnow()
        }
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Narration generation failed: {str(e)}"
        )


@router.get("/status/{job_id}", response_model=NarrationStatus)
async def get_narration_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    查询解读生成状态
    """
    if job_id not in job_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    job = job_store[job_id]
    
    return NarrationStatus(
        jobId=job_id,
        status=job["status"],
        progress=100 if job["status"] == JobStatus.SUCCEEDED else None,
        audioUrl=job.get("audio_url"),
        text=job.get("result", {}).summary if job.get("result") else None,
        result=job.get("result"),
        error=job.get("error"),
        createdAt=job["created_at"],
        completedAt=job.get("completed_at")
    )

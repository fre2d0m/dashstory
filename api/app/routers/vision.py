"""
Vision Router - 多模态图像识别
"""

import uuid
import base64
from fastapi import APIRouter, Depends, HTTPException, status
import structlog

from app.core.security import get_current_user
from app.schemas.vision import VisionInterpretRequest, VisionInterpretResponse
from app.services.vision_service import VisionService
from app.services.tts_service import TTSService

router = APIRouter()
logger = structlog.get_logger()


# 服务实例
vision_service = VisionService()
tts_service = TTSService()


@router.post("/interpret", response_model=VisionInterpretResponse)
async def interpret_image(
    request: VisionInterpretRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    多模态图像识别与解读
    
    接收截图图片，使用多模态模型识别图表内容并生成解读
    """
    job_id = str(uuid.uuid4())
    org_id = current_user.get("org_id")
    
    logger.info(
        "Vision interpret request received",
        job_id=job_id,
        org_id=org_id,
        page_url=request.pageUrl
    )
    
    try:
        # 验证图片大小
        image_size = _get_image_size(request.image)
        if image_size > 2 * 1024 * 1024:  # 2MB
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image size exceeds 2MB limit"
            )
        
        # 调用视觉模型
        vision_result = await vision_service.interpret(
            image_data=request.image,
            language=request.language
        )
        
        # 生成语音（如果置信度足够）
        audio_url = None
        if vision_result["confidence"] >= 0.6:
            audio_result = await tts_service.synthesize(
                text=vision_result["summary"],
                voice_id="professional",
                language=request.language
            )
            audio_url = audio_result.get("audio_url")
        
        logger.info(
            "Vision interpretation completed",
            job_id=job_id,
            confidence=vision_result["confidence"],
            chart_types=vision_result.get("chart_types", [])
        )
        
        return VisionInterpretResponse(
            jobId=job_id,
            text=vision_result["text"],
            audioUrl=audio_url,
            summary=vision_result["summary"],
            highlights=vision_result.get("highlights", []),
            risks=vision_result.get("risks", []),
            nextActions=vision_result.get("next_actions", []),
            confidence=vision_result["confidence"],
            chartTypes=vision_result.get("chart_types", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Vision interpretation failed",
            job_id=job_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Vision interpretation failed: {str(e)}"
        )


def _get_image_size(image_data: str) -> int:
    """获取图片大小（字节）"""
    # 移除data URI前缀
    if "," in image_data:
        image_data = image_data.split(",")[1]
    
    # Base64解码后的大小
    return len(base64.b64decode(image_data))

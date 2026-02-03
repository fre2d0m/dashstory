"""
Voices Router - 语音管理
"""

from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import get_current_user

router = APIRouter()


class Voice(BaseModel):
    """语音配置"""
    id: str = Field(..., description="语音ID")
    name: str = Field(..., description="语音名称")
    nameEn: str = Field(..., description="英文名称")
    gender: str = Field(..., description="性别")
    style: str = Field(..., description="风格")
    previewUrl: str = Field(None, description="预览音频URL")
    isDefault: bool = Field(default=False, description="是否默认")


# 预设语音列表
AVAILABLE_VOICES = [
    Voice(
        id="professional",
        name="专业风格",
        nameEn="Professional",
        gender="neutral",
        style="formal",
        previewUrl="/audio/samples/professional.mp3",
        isDefault=True
    ),
    Voice(
        id="friendly",
        name="友好风格",
        nameEn="Friendly",
        gender="neutral",
        style="casual",
        previewUrl="/audio/samples/friendly.mp3",
        isDefault=False
    ),
    Voice(
        id="energetic",
        name="活力风格",
        nameEn="Energetic",
        gender="neutral",
        style="energetic",
        previewUrl="/audio/samples/energetic.mp3",
        isDefault=False
    ),
    Voice(
        id="calm",
        name="沉稳风格",
        nameEn="Calm",
        gender="neutral",
        style="calm",
        previewUrl="/audio/samples/calm.mp3",
        isDefault=False
    ),
]


@router.get("", response_model=List[Voice])
async def list_voices(
    current_user: dict = Depends(get_current_user)
):
    """
    获取可用语音列表
    """
    return AVAILABLE_VOICES


@router.get("/{voice_id}", response_model=Voice)
async def get_voice(
    voice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取语音详情
    """
    for voice in AVAILABLE_VOICES:
        if voice.id == voice_id:
            return voice
    
    from fastapi import HTTPException, status
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Voice {voice_id} not found"
    )

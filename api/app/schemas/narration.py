"""Narration schemas"""

from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime

from app.schemas.panel import PanelData


class PlayMode(str, Enum):
    """播放模式"""
    ALL = "all"
    SINGLE = "single"


class JobStatus(str, Enum):
    """任务状态"""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class NarrationRequest(BaseModel):
    """解读生成请求"""
    
    voiceId: str = Field(default="professional", description="语音ID")
    panels: List[PanelData] = Field(..., description="Panel数据")
    playMode: PlayMode = Field(default=PlayMode.ALL, description="播放模式")
    language: str = Field(default="zh", description="语言")

    class Config:
        json_schema_extra = {
            "example": {
                "voiceId": "professional",
                "panels": [{
                    "panelId": "revenue",
                    "title": "收入趋势",
                    "metricType": "time_series",
                    "unit": "USD",
                    "timeRange": "2025-01",
                    "data": [{"t": "2025-01", "v": 100000}]
                }],
                "playMode": "all",
                "language": "zh"
            }
        }


class NarrationResult(BaseModel):
    """解读结果"""
    
    summary: str = Field(..., description="摘要")
    highlights: List[str] = Field(default_factory=list, description="亮点")
    risks: List[str] = Field(default_factory=list, description="风险")
    nextActions: List[str] = Field(default_factory=list, description="建议行动")


class NarrationResponse(BaseModel):
    """解读生成响应"""
    
    jobId: str = Field(..., description="任务ID")
    status: JobStatus = Field(..., description="任务状态")
    audioUrl: Optional[str] = Field(None, description="音频URL")
    text: Optional[str] = Field(None, description="解读文本")
    result: Optional[NarrationResult] = Field(None, description="结构化结果")
    duration: Optional[float] = Field(None, description="音频时长(秒)")


class NarrationStatus(BaseModel):
    """解读状态查询响应"""
    
    jobId: str = Field(..., description="任务ID")
    status: JobStatus = Field(..., description="任务状态")
    progress: Optional[int] = Field(None, description="进度百分比")
    audioUrl: Optional[str] = Field(None, description="音频URL")
    text: Optional[str] = Field(None, description="解读文本")
    result: Optional[NarrationResult] = Field(None, description="结构化结果")
    error: Optional[str] = Field(None, description="错误信息")
    createdAt: datetime = Field(..., description="创建时间")
    completedAt: Optional[datetime] = Field(None, description="完成时间")

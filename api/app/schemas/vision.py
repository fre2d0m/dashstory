"""Vision interpretation schemas"""

from typing import List, Optional
from pydantic import BaseModel, Field


class VisionInterpretRequest(BaseModel):
    """多模态识别请求"""
    
    image: str = Field(..., description="Base64编码的图片数据")
    pageUrl: Optional[str] = Field(None, description="页面URL")
    language: str = Field(default="zh", description="输出语言")

    class Config:
        json_schema_extra = {
            "example": {
                "image": "data:image/png;base64,iVBORw0KGgo...",
                "pageUrl": "https://example.com/dashboard",
                "language": "zh"
            }
        }


class VisionInterpretResponse(BaseModel):
    """多模态识别响应"""
    
    jobId: str = Field(..., description="任务ID")
    text: str = Field(..., description="解读文本")
    audioUrl: Optional[str] = Field(None, description="音频URL")
    summary: str = Field(..., description="摘要")
    highlights: List[str] = Field(default_factory=list, description="亮点")
    risks: List[str] = Field(default_factory=list, description="风险")
    nextActions: List[str] = Field(default_factory=list, description="建议行动")
    confidence: float = Field(..., ge=0, le=1, description="置信度")
    chartTypes: List[str] = Field(default_factory=list, description="识别到的图表类型")

"""
Telemetry Router - 遥测数据收集
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import structlog

from app.core.security import get_current_user

router = APIRouter()
logger = structlog.get_logger()


class TelemetryEvent(BaseModel):
    """遥测事件"""
    event: str = Field(..., description="事件名称")
    properties: Dict[str, Any] = Field(default_factory=dict, description="事件属性")
    timestamp: Optional[int] = Field(None, description="时间戳")


class TelemetryBatchRequest(BaseModel):
    """批量遥测请求"""
    events: list[TelemetryEvent] = Field(..., description="事件列表")


@router.post("")
async def record_telemetry(
    request: TelemetryBatchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    记录遥测数据
    
    SDK和插件上报使用数据，用于分析和优化
    """
    org_id = current_user.get("org_id")
    
    for event in request.events:
        logger.info(
            "Telemetry event",
            org_id=org_id,
            event=event.event,
            properties=event.properties,
            timestamp=event.timestamp
        )
    
    # TODO: 存储到时序数据库或分析系统
    
    return {"recorded": len(request.events)}


@router.post("/playback")
async def record_playback(
    panel_id: str,
    duration: float,
    completed: bool,
    current_user: dict = Depends(get_current_user)
):
    """
    记录播放统计
    """
    org_id = current_user.get("org_id")
    
    logger.info(
        "Playback telemetry",
        org_id=org_id,
        panel_id=panel_id,
        duration=duration,
        completed=completed
    )
    
    return {"success": True}

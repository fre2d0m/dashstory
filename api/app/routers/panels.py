"""
Panels Router - Panel数据管理
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
import structlog

from app.core.security import get_current_user
from app.schemas.panel import (
    PanelData,
    PanelBatchRequest,
    PanelBatchResponse
)

router = APIRouter()
logger = structlog.get_logger()


@router.post("/batch", response_model=PanelBatchResponse)
async def batch_upload_panels(
    request: PanelBatchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    批量上报Panel数据
    
    SDK调用此接口上报多个Panel的数据，用于后续生成解读
    """
    org_id = current_user.get("org_id")
    
    logger.info(
        "Batch panel upload",
        org_id=org_id,
        panel_count=len(request.panels)
    )
    
    accepted_panels = []
    rejected_panels = []
    
    for panel in request.panels:
        try:
            # 验证Panel数据
            _validate_panel(panel)
            accepted_panels.append(panel.panelId)
            
            # TODO: 存储到Redis/数据库用于后续生成
            
        except ValueError as e:
            rejected_panels.append(panel.panelId)
            logger.warning(
                "Panel validation failed",
                panel_id=panel.panelId,
                error=str(e)
            )
    
    return PanelBatchResponse(
        accepted=len(rejected_panels) == 0,
        acceptedCount=len(accepted_panels),
        rejected=rejected_panels,
        message=f"Successfully processed {len(accepted_panels)} panels"
    )


@router.get("/{panel_id}", response_model=PanelData)
async def get_panel(
    panel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取单个Panel数据
    """
    # TODO: 从存储中获取
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Panel {panel_id} not found"
    )


@router.delete("/{panel_id}")
async def delete_panel(
    panel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    删除Panel数据
    """
    # TODO: 从存储中删除
    return {"message": f"Panel {panel_id} deleted"}


def _validate_panel(panel: PanelData) -> None:
    """验证Panel数据"""
    
    # 检查数据不为空
    if not panel.data:
        raise ValueError(f"Panel {panel.panelId} has empty data")
    
    # 根据类型验证数据格式
    if panel.metricType == "time_series":
        if not isinstance(panel.data, list):
            raise ValueError(f"Time series panel {panel.panelId} data must be a list")
        for point in panel.data:
            if not isinstance(point, dict) or "t" not in point or "v" not in point:
                raise ValueError(
                    f"Time series data point must have 't' and 'v' fields"
                )
    
    elif panel.metricType == "distribution":
        if not isinstance(panel.data, list):
            raise ValueError(f"Distribution panel {panel.panelId} data must be a list")
    
    elif panel.metricType == "single_value":
        if not isinstance(panel.data, dict):
            raise ValueError(f"Single value panel {panel.panelId} data must be an object")

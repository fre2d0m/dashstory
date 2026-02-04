"""Panel data schemas"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class MetricType(str, Enum):
    """指标类型"""
    TIME_SERIES = "time_series"
    DISTRIBUTION = "distribution"
    COMPARISON = "comparison"
    SINGLE_VALUE = "single_value"
    TABLE = "table"


class Threshold(BaseModel):
    """阈值配置"""
    warning: Optional[float] = None
    critical: Optional[float] = None
    success: Optional[float] = None


class PanelData(BaseModel):
    """Panel数据模型"""
    
    panelId: str = Field(..., description="Panel唯一标识")
    title: str = Field(..., description="Panel标题")
    metricType: MetricType = Field(..., description="指标类型")
    unit: str = Field(..., description="单位")
    timeRange: str = Field(..., description="时间范围")
    data: Union[List[Dict[str, Any]], Dict[str, Any]] = Field(
        ..., description="数据内容"
    )
    
    # 可选字段
    description: Optional[str] = Field(None, description="描述")
    dimension: Optional[str] = Field(None, description="维度")
    aggregation: Optional[str] = Field(None, description="聚合方式")
    thresholds: Optional[Threshold] = Field(None, description="阈值配置")
    owner: Optional[str] = Field(None, description="负责人")
    order: Optional[int] = Field(None, description="排序序号")

    class Config:
        json_schema_extra = {
            "example": {
                "panelId": "revenue_trend",
                "title": "月度收入趋势",
                "metricType": "time_series",
                "unit": "USD",
                "timeRange": "2025-01-01~2025-12-31",
                "data": [
                    {"t": "2025-01", "v": 120000},
                    {"t": "2025-02", "v": 135000}
                ],
                "thresholds": {"warning": 100000, "critical": 80000},
                "order": 1
            }
        }


class PanelBatchRequest(BaseModel):
    """批量Panel上报请求"""
    panels: List[PanelData] = Field(..., description="Panel数据列表")


class PanelBatchResponse(BaseModel):
    """批量Panel上报响应"""
    accepted: bool = Field(..., description="是否成功")
    acceptedCount: int = Field(..., description="成功数量")
    rejected: List[str] = Field(default_factory=list, description="失败的panelId列表")
    message: Optional[str] = None

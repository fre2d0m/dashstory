"""Authentication schemas"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class TokenResponse(BaseModel):
    """Token响应"""
    
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间(秒)")


class ApiKeyCreate(BaseModel):
    """API Key创建请求"""
    
    name: str = Field(..., description="API Key名称")
    scopes: List[str] = Field(
        default_factory=lambda: ["read", "write"],
        description="权限范围"
    )


class ApiKeyResponse(BaseModel):
    """API Key响应"""
    
    id: str = Field(..., description="API Key ID")
    name: str = Field(..., description="名称")
    key: Optional[str] = Field(None, description="API Key（仅创建时返回）")
    scopes: List[str] = Field(..., description="权限范围")
    createdAt: datetime = Field(..., description="创建时间")
    lastUsedAt: Optional[datetime] = Field(None, description="最后使用时间")
    isActive: bool = Field(default=True, description="是否激活")


class ValidateResponse(BaseModel):
    """API Key验证响应"""
    
    valid: bool = Field(..., description="是否有效")
    org_id: Optional[str] = Field(None, description="组织ID")
    scopes: List[str] = Field(default_factory=list, description="权限范围")

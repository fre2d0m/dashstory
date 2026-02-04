"""
Authentication Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security import (
    security,
    verify_token,
    create_api_key,
    verify_api_key,
    get_current_user
)
from app.schemas.auth import (
    TokenResponse,
    ApiKeyCreate,
    ApiKeyResponse,
    ValidateResponse
)

router = APIRouter()


@router.get("/validate", response_model=ValidateResponse)
async def validate_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    验证API Key是否有效
    
    用于SDK和插件初始化时验证API Key
    """
    try:
        payload = verify_token(credentials.credentials)
        return ValidateResponse(
            valid=True,
            org_id=payload.get("org_id"),
            scopes=payload.get("scopes", [])
        )
    except HTTPException:
        return ValidateResponse(valid=False)


@router.post("/api-keys", response_model=ApiKeyResponse)
async def create_new_api_key(
    request: ApiKeyCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    创建新的API Key
    
    仅管理员可操作
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create API keys"
        )
    
    org_id = current_user.get("org_id")
    api_key = create_api_key(org_id, request.name)
    
    from datetime import datetime
    import uuid
    
    return ApiKeyResponse(
        id=str(uuid.uuid4()),
        name=request.name,
        key=api_key,  # 仅创建时返回
        scopes=request.scopes,
        createdAt=datetime.utcnow(),
        isActive=True
    )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    撤销API Key
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can revoke API keys"
        )
    
    # TODO: 实际实现需要数据库操作
    return {"message": f"API key {key_id} has been revoked"}

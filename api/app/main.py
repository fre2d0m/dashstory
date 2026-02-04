"""
DashStory API - Main Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.core.config import settings
from app.routers import auth, panels, narration, vision, voices, telemetry


# 配置结构化日志
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("DashStory API starting", version=settings.VERSION)
    yield
    # 关闭时
    logger.info("DashStory API shutting down")


# 创建FastAPI应用
app = FastAPI(
    title="DashStory API",
    description="AI-powered dashboard narration platform - Transform complex data into narrated insights",
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(panels.router, prefix="/api/v1/panels", tags=["Panel管理"])
app.include_router(narration.router, prefix="/api/v1/narration", tags=["解读生成"])
app.include_router(vision.router, prefix="/api/v1/vision", tags=["多模态识别"])
app.include_router(voices.router, prefix="/api/v1/voices", tags=["语音管理"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["遥测"])


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "service": "dashstory-api"
    }


@app.get("/")
async def root():
    """API根路径"""
    return {
        "service": "DashStory API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Disabled in production"
    }

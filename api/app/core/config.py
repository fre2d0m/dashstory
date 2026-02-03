"""
Application Configuration
"""

from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    
    # API配置
    API_PREFIX: str = "/api/v1"
    
    # CORS配置
    CORS_ORIGINS: List[str] = ["*"]
    
    # JWT配置
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24小时
    
    # 数据库配置
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dashstory"
    
    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 对象存储配置
    S3_ENDPOINT: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "dashstory"
    S3_REGION: str = "us-east-1"
    
    # AI模型配置
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-vision-preview"
    OPENAI_TTS_MODEL: str = "tts-1"
    
    # 语音配置
    TTS_DEFAULT_VOICE: str = "alloy"
    TTS_SPEED: float = 1.0
    
    # 限流配置
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # 缓存配置
    CACHE_TTL_SECONDS: int = 300  # 5分钟
    
    # 音频配置
    AUDIO_RETENTION_DAYS: int = 7
    MAX_AUDIO_LENGTH_SECONDS: int = 300  # 5分钟
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()

"""
TTS Service - 语音合成服务
"""

import uuid
import base64
from typing import Dict, Any
import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class TTSService:
    """语音合成服务"""
    
    # 语音ID映射到OpenAI TTS voices
    VOICE_MAPPING = {
        "professional": "onyx",      # 专业、沉稳
        "friendly": "nova",          # 友好、亲切
        "energetic": "shimmer",      # 活力、明亮
        "calm": "echo",              # 平静、舒缓
    }
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_TTS_MODEL
    
    async def synthesize(
        self,
        text: str,
        voice_id: str = "professional",
        language: str = "zh",
        speed: float = 1.0
    ) -> Dict[str, Any]:
        """
        文本转语音
        """
        logger.info(
            "TTS synthesis request",
            text_length=len(text),
            voice_id=voice_id,
            language=language
        )
        
        # 限制文本长度
        max_chars = 4096
        if len(text) > max_chars:
            text = text[:max_chars]
            logger.warning("Text truncated for TTS", original_length=len(text))
        
        try:
            # 获取OpenAI voice
            openai_voice = self.VOICE_MAPPING.get(voice_id, "onyx")
            
            # 调用OpenAI TTS API
            audio_data = await self._call_tts_api(text, openai_voice, speed)
            
            # 生成音频URL（实际应上传到对象存储）
            audio_id = str(uuid.uuid4())
            audio_url = await self._store_audio(audio_id, audio_data)
            
            # 估算时长（约150字/分钟）
            duration = len(text) / 150 * 60 / speed
            
            return {
                "audio_url": audio_url,
                "duration": round(duration, 2),
                "format": "mp3"
            }
            
        except Exception as e:
            logger.error("TTS synthesis error", error=str(e))
            # 返回占位URL
            return {
                "audio_url": f"/audio/placeholder/{uuid.uuid4()}.mp3",
                "duration": 0,
                "format": "mp3",
                "error": str(e)
            }
    
    async def _call_tts_api(
        self,
        text: str,
        voice: str,
        speed: float
    ) -> bytes:
        """调用OpenAI TTS API"""
        
        if not self.api_key:
            # 无API Key时返回空音频
            logger.warning("No OpenAI API key, returning mock audio")
            return self._mock_audio()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "input": text,
                    "voice": voice,
                    "response_format": "mp3",
                    "speed": speed
                },
                timeout=60.0
            )
            
            response.raise_for_status()
            return response.content
    
    async def _store_audio(self, audio_id: str, audio_data: bytes) -> str:
        """
        存储音频文件
        
        实际应上传到S3/对象存储，这里简化处理
        """
        # TODO: 实现实际的对象存储上传
        # 生产环境应该：
        # 1. 上传到S3/OSS
        # 2. 返回CDN URL
        # 3. 设置过期时间
        
        if settings.S3_ENDPOINT and settings.S3_ACCESS_KEY:
            # 使用S3存储
            return await self._upload_to_s3(audio_id, audio_data)
        
        # 开发环境：返回mock URL
        return f"/api/v1/audio/{audio_id}.mp3"
    
    async def _upload_to_s3(self, audio_id: str, audio_data: bytes) -> str:
        """上传到S3"""
        import boto3
        from botocore.config import Config
        
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT or None,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version='s3v4')
        )
        
        key = f"audio/{audio_id}.mp3"
        
        s3_client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=audio_data,
            ContentType='audio/mpeg'
        )
        
        # 生成预签名URL
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET,
                'Key': key
            },
            ExpiresIn=settings.AUDIO_RETENTION_DAYS * 24 * 3600
        )
        
        return url
    
    def _mock_audio(self) -> bytes:
        """返回空白音频（开发用）"""
        # 最小有效MP3文件头
        return bytes([
            0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ])

"""
Vision Service - 多模态图像识别服务
"""

import json
import base64
from typing import Dict, Any
import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class VisionService:
    """多模态图像识别服务"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
    
    async def interpret(
        self,
        image_data: str,
        language: str = "zh"
    ) -> Dict[str, Any]:
        """
        解读图像中的图表/Dashboard内容
        """
        logger.info(
            "Vision interpretation request",
            language=language,
            image_size=len(image_data)
        )
        
        try:
            # 调用视觉模型
            response = await self._call_vision_api(image_data, language)
            
            # 解析响应
            result = self._parse_response(response, language)
            
            return result
            
        except Exception as e:
            logger.error("Vision interpretation error", error=str(e))
            # 降级响应
            return self._fallback_response(language)
    
    async def _call_vision_api(
        self,
        image_data: str,
        language: str
    ) -> str:
        """调用OpenAI Vision API"""
        
        if not self.api_key:
            logger.warning("No OpenAI API key, returning mock response")
            return self._mock_response(language)
        
        # 构建提示词
        if language == "zh":
            prompt = """请分析这张Dashboard/图表截图，并提供结构化的解读。

要求：
1. 识别图表类型（折线图、柱状图、饼图等）
2. 提取关键数值和趋势
3. 标注异常或需要关注的点
4. 不要编造数据，如果看不清请标注

输出JSON格式：
{
  "summary": "整体概述",
  "text": "详细解读文本",
  "highlights": ["亮点1", "亮点2"],
  "risks": ["风险1"],
  "next_actions": ["建议1"],
  "chart_types": ["line", "bar"],
  "confidence": 0.85
}"""
        else:
            prompt = """Please analyze this Dashboard/chart screenshot and provide a structured interpretation.

Requirements:
1. Identify chart types (line, bar, pie, etc.)
2. Extract key values and trends
3. Highlight anomalies or points of attention
4. Don't fabricate data, mark if unclear

Output JSON format:
{
  "summary": "Overall summary",
  "text": "Detailed interpretation",
  "highlights": ["highlight1", "highlight2"],
  "risks": ["risk1"],
  "next_actions": ["action1"],
  "chart_types": ["line", "bar"],
  "confidence": 0.85
}"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4-vision-preview",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_data if image_data.startswith("data:") 
                                               else f"data:image/png;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 1500
                },
                timeout=60.0
            )
            
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _parse_response(self, response: str, language: str) -> Dict[str, Any]:
        """解析Vision API响应"""
        
        try:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    "summary": data.get("summary", ""),
                    "text": data.get("text", data.get("summary", "")),
                    "highlights": data.get("highlights", []),
                    "risks": data.get("risks", []),
                    "next_actions": data.get("next_actions", []),
                    "chart_types": data.get("chart_types", []),
                    "confidence": float(data.get("confidence", 0.7))
                }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse vision response as JSON", error=str(e))
        
        # 解析失败时返回原始文本
        return {
            "summary": response[:200],
            "text": response,
            "highlights": [],
            "risks": [],
            "next_actions": [],
            "chart_types": [],
            "confidence": 0.5
        }
    
    def _fallback_response(self, language: str) -> Dict[str, Any]:
        """降级响应"""
        
        if language == "zh":
            return {
                "summary": "图像识别遇到问题，请稍后重试或尝试更清晰的截图",
                "text": "无法解析图像内容",
                "highlights": [],
                "risks": ["识别失败"],
                "next_actions": ["请尝试重新截图"],
                "chart_types": [],
                "confidence": 0.0
            }
        else:
            return {
                "summary": "Image recognition encountered an issue. Please retry or try a clearer screenshot.",
                "text": "Unable to parse image content",
                "highlights": [],
                "risks": ["Recognition failed"],
                "next_actions": ["Please try taking a new screenshot"],
                "chart_types": [],
                "confidence": 0.0
            }
    
    def _mock_response(self, language: str) -> str:
        """模拟响应（开发用）"""
        
        if language == "zh":
            return json.dumps({
                "summary": "这是一个销售数据Dashboard，展示了月度收入、订单量和客户增长趋势。整体表现良好，收入呈上升趋势。",
                "text": "Dashboard包含4个核心指标面板：1）月度收入135,000美元，环比增长12.5%；2）订单数量1,234单；3）新增客户89人；4）转化率3.2%。收入趋势图显示稳步上升，但新客户增长有所放缓。",
                "highlights": [
                    "月度收入达到135,000美元，超过预期",
                    "转化率提升至3.2%，表现优异",
                    "订单量保持稳定增长"
                ],
                "risks": [
                    "新增客户数量下降5.2%，需要关注",
                    "部分地区数据缺失"
                ],
                "next_actions": [
                    "分析新客户下降原因",
                    "优化获客渠道投放",
                    "关注转化率持续性"
                ],
                "chart_types": ["line", "bar", "number"],
                "confidence": 0.88
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "summary": "This is a sales data Dashboard showing monthly revenue, order volume, and customer growth trends. Overall performance is good with revenue trending upward.",
                "text": "The Dashboard contains 4 key metric panels: 1) Monthly revenue $135,000, up 12.5% MoM; 2) Order count 1,234; 3) New customers 89; 4) Conversion rate 3.2%.",
                "highlights": [
                    "Monthly revenue reached $135,000, exceeding expectations",
                    "Conversion rate improved to 3.2%",
                    "Order volume maintains steady growth"
                ],
                "risks": [
                    "New customer acquisition down 5.2%, needs attention",
                    "Some regional data is missing"
                ],
                "next_actions": [
                    "Analyze new customer decline reasons",
                    "Optimize acquisition channel spending",
                    "Monitor conversion rate sustainability"
                ],
                "chart_types": ["line", "bar", "number"],
                "confidence": 0.88
            })

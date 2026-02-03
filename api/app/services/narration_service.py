"""
Narration Service - 解读生成服务
"""

from typing import List, Dict, Any
import json
import httpx
import structlog

from app.core.config import settings
from app.schemas.narration import NarrationResult

logger = structlog.get_logger()


class NarrationService:
    """解读生成服务"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
    
    async def generate_narration(
        self,
        panels: List[Dict[str, Any]],
        language: str = "zh"
    ) -> NarrationResult:
        """
        根据Panel数据生成结构化解读
        """
        # 构建提示词
        prompt = self._build_prompt(panels, language)
        
        try:
            # 调用OpenAI API
            response = await self._call_llm(prompt, language)
            
            # 解析响应
            result = self._parse_response(response, language)
            
            return result
            
        except Exception as e:
            logger.error("Narration generation error", error=str(e))
            # 降级：返回基础摘要
            return self._fallback_narration(panels, language)
    
    def _build_prompt(
        self,
        panels: List[Dict[str, Any]],
        language: str
    ) -> str:
        """构建提示词"""
        
        if language == "zh":
            system_prompt = """你是一位专业的数据分析师，擅长解读Dashboard数据并提供商业洞察。
请根据以下Panel数据生成结构化的解读报告。

要求：
1. 必须引用具体的数值和时间范围
2. 不得凭空猜测原因，需标注"可能"或"需验证"
3. 高亮异常数据（超过阈值或显著波动）
4. 输出JSON格式

输出格式：
{
  "summary": "整体概述（2-3句话）",
  "highlights": ["亮点1", "亮点2"],
  "risks": ["风险1", "风险2"],
  "nextActions": ["建议行动1", "建议行动2"]
}"""
        else:
            system_prompt = """You are a professional data analyst skilled at interpreting dashboard data and providing business insights.
Please generate a structured analysis report based on the following Panel data.

Requirements:
1. Must reference specific values and time ranges
2. Do not guess reasons without evidence, mark as "possibly" or "needs verification"
3. Highlight anomalies (threshold breaches or significant fluctuations)
4. Output in JSON format

Output format:
{
  "summary": "Overall summary (2-3 sentences)",
  "highlights": ["highlight1", "highlight2"],
  "risks": ["risk1", "risk2"],
  "nextActions": ["action1", "action2"]
}"""
        
        panel_data = json.dumps(panels, ensure_ascii=False, indent=2)
        user_prompt = f"Panel数据：\n{panel_data}\n\n请生成解读报告。"
        
        return f"{system_prompt}\n\n{user_prompt}"
    
    async def _call_llm(self, prompt: str, language: str) -> str:
        """调用LLM API"""
        
        if not self.api_key:
            # 无API Key时返回模拟数据
            return self._mock_response(language)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4-turbo-preview",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _parse_response(self, response: str, language: str) -> NarrationResult:
        """解析LLM响应"""
        
        try:
            # 尝试提取JSON
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
                return NarrationResult(
                    summary=data.get("summary", ""),
                    highlights=data.get("highlights", []),
                    risks=data.get("risks", []),
                    nextActions=data.get("nextActions", [])
                )
        except json.JSONDecodeError:
            pass
        
        # 解析失败，使用原始文本作为摘要
        return NarrationResult(
            summary=response[:500],
            highlights=[],
            risks=[],
            nextActions=[]
        )
    
    def _fallback_narration(
        self,
        panels: List[Dict[str, Any]],
        language: str
    ) -> NarrationResult:
        """降级方案：基础摘要"""
        
        panel_names = [p.get("title", p.get("panelId", "")) for p in panels]
        
        if language == "zh":
            summary = f"本报告包含 {len(panels)} 个数据面板的分析：{', '.join(panel_names)}。"
            return NarrationResult(
                summary=summary,
                highlights=["数据已成功加载"],
                risks=["需要进一步分析以获取深入洞察"],
                nextActions=["请查看各面板详细数据"]
            )
        else:
            summary = f"This report analyzes {len(panels)} data panels: {', '.join(panel_names)}."
            return NarrationResult(
                summary=summary,
                highlights=["Data loaded successfully"],
                risks=["Further analysis needed for deeper insights"],
                nextActions=["Please review detailed panel data"]
            )
    
    def _mock_response(self, language: str) -> str:
        """模拟响应（开发/演示用）"""
        
        if language == "zh":
            return json.dumps({
                "summary": "本月整体业务表现良好。收入较上月增长12.5%，达到135,000美元，超过预警阈值。订单量保持稳定增长态势。",
                "highlights": [
                    "月度收入增长12.5%，表现强劲",
                    "订单转化率提升至3.2%",
                    "电子产品类目贡献最大"
                ],
                "risks": [
                    "新增客户数较上月下降5.2%，需关注获客渠道",
                    "小程序渠道转化率下滑，可能需要优化体验"
                ],
                "nextActions": [
                    "分析客户流失原因，优化获客策略",
                    "排查小程序转化漏斗，找出瓶颈环节",
                    "继续保持电子产品的营销投入"
                ]
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "summary": "Overall business performance is strong this month. Revenue increased by 12.5% compared to last month, reaching $135,000, exceeding the warning threshold.",
                "highlights": [
                    "Monthly revenue grew 12.5%, showing strong performance",
                    "Order conversion rate improved to 3.2%",
                    "Electronics category contributed the most"
                ],
                "risks": [
                    "New customer acquisition dropped 5.2% MoM, need to monitor acquisition channels",
                    "Mini program conversion rate declined, may need UX optimization"
                ],
                "nextActions": [
                    "Analyze customer churn reasons and optimize acquisition strategy",
                    "Audit mini program conversion funnel to identify bottlenecks",
                    "Maintain marketing investment in electronics category"
                ]
            })

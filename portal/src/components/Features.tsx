import { Mic, Eye, Zap, Shield, Globe, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'AI语音解读',
    description: '将Dashboard数据转化为自然流畅的语音叙述，支持多种语音风格选择。',
  },
  {
    icon: Eye,
    title: '智能图表识别',
    description: '多模态AI自动识别截图中的图表类型和关键数据，准确率达98%。',
  },
  {
    icon: Zap,
    title: '5秒极速生成',
    description: '端到端解读生成时间P95 ≤ 5秒，满足实时演示和销售场景需求。',
  },
  {
    icon: Shield,
    title: '企业级安全',
    description: '全链路TLS加密，数据最小化存储，支持删除请求和审计日志。',
  },
  {
    icon: Globe,
    title: '多语言支持',
    description: '支持中文和英文解读，更多语言即将上线。',
  },
  {
    icon: BarChart3,
    title: '结构化输出',
    description: '解读结果包含摘要、亮点、风险和建议行动，便于理解和分享。',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            强大的功能特性
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            为开发者和业务人员设计的全方位解决方案
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

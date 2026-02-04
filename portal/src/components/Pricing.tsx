import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: '免费版',
    price: '0',
    description: '适合个人开发者体验',
    features: [
      '每月100次解读',
      '2种语音风格',
      '基础API访问',
      '社区支持',
    ],
    cta: '开始使用',
    highlighted: false,
  },
  {
    name: '专业版',
    price: '99',
    description: '适合中小型团队',
    features: [
      '每月10,000次解读',
      '全部语音风格',
      '高级API访问',
      '优先技术支持',
      'Webhook通知',
      '使用分析报告',
    ],
    cta: '开始试用',
    highlighted: true,
  },
  {
    name: '企业版',
    price: '定制',
    description: '适合大型企业',
    features: [
      '无限次解读',
      '语音克隆定制',
      '专属API实例',
      '24/7专属支持',
      'SLA保障',
      '安全审计与合规',
      '私有化部署',
    ],
    cta: '联系销售',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            简单透明的定价
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            选择适合您的方案，随时升级
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-primary text-white shadow-xl scale-105'
                  : 'bg-gray-50 text-gray-900'
              }`}
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">
                  {plan.price === '定制' ? '' : '¥'}
                  {plan.price}
                </span>
                {plan.price !== '定制' && (
                  <span className={`ml-2 ${plan.highlighted ? 'text-white/70' : 'text-gray-500'}`}>
                    /月
                  </span>
                )}
              </div>
              <p className={`mt-2 ${plan.highlighted ? 'text-white/80' : 'text-gray-600'}`}>
                {plan.description}
              </p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className={`w-5 h-5 mr-3 ${
                      plan.highlighted ? 'text-yellow-300' : 'text-primary-500'
                    }`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-8 block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-primary-600 hover:bg-gray-50'
                    : 'bg-gradient-primary text-white hover:opacity-90'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

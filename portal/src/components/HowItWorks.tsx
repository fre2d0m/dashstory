import { Code, MousePointer, Headphones } from 'lucide-react';

const steps = [
  {
    icon: Code,
    title: '1. 集成SDK',
    description: '在您的Dashboard中引入DashStory SDK，注册Panel数据。',
    code: `dashstory.registerPanel({
  panelId: 'revenue',
  title: '月度收入',
  data: [...]
});`,
  },
  {
    icon: MousePointer,
    title: '2. 触发解读',
    description: '用户按下快捷键或点击按钮，即可触发AI解读生成。',
    code: `// 快捷键: Ctrl+Shift+D
// 或调用API
await dashstory.playAll();`,
  },
  {
    icon: Headphones,
    title: '3. 聆听洞察',
    description: '5秒内生成语音解读，包含摘要、亮点和建议行动。',
    code: `{
  "summary": "收入增长12.5%...",
  "highlights": [...],
  "nextActions": [...]
}`,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            简单三步，即刻开始
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            集成时间不超过1天，让您的Dashboard会说话
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`flex flex-col md:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-lg text-gray-600">{step.description}</p>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-gray-900 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

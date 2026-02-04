'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const docSections = [
  {
    id: 'getting-started',
    title: '快速开始',
    items: [
      { id: 'introduction', title: '简介' },
      { id: 'installation', title: '安装' },
      { id: 'quick-start', title: '快速入门' },
    ],
  },
  {
    id: 'sdk',
    title: 'SDK集成',
    items: [
      { id: 'sdk-overview', title: '概述' },
      { id: 'panel-registration', title: 'Panel注册' },
      { id: 'demo-bar', title: '演示模式Bar' },
      { id: 'events', title: '事件监听' },
    ],
  },
  {
    id: 'extension',
    title: '浏览器插件',
    items: [
      { id: 'extension-install', title: '安装插件' },
      { id: 'screenshot', title: '截图功能' },
      { id: 'interpretation', title: '解读生成' },
    ],
  },
  {
    id: 'api',
    title: 'API参考',
    items: [
      { id: 'authentication', title: '认证' },
      { id: 'panels-api', title: 'Panels API' },
      { id: 'narration-api', title: 'Narration API' },
      { id: 'vision-api', title: 'Vision API' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-6">
              {docSections.map((section) => (
                <div key={section.id}>
                  <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === item.id
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {activeSection === 'introduction' && (
              <div className="prose max-w-none">
                <h1>DashStory 简介</h1>
                <p>
                  DashStory是一个AI驱动的仪表板解读平台，帮助您将复杂的数据可视化转化为直观、可听的洞察叙事。
                </p>
                
                <h2>核心能力</h2>
                <ul>
                  <li><strong>SDK集成</strong>：在您的Dashboard中嵌入"开始解读"按钮，一键播放AI语音解读</li>
                  <li><strong>浏览器插件</strong>：截图任意Dashboard，即时生成语音解读</li>
                  <li><strong>语音克隆</strong>：使用您的声音进行解读（企业版）</li>
                </ul>

                <h2>适用场景</h2>
                <ul>
                  <li>产品/研发汇报时一键播放数据解读</li>
                  <li>销售现场快速讲解客户Dashboard</li>
                  <li>远程协作时生成可分享的音频摘要</li>
                </ul>
              </div>
            )}

            {activeSection === 'installation' && (
              <div className="prose max-w-none">
                <h1>安装指南</h1>
                
                <h2>SDK安装</h2>
                <p>通过npm安装：</p>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>npm install @dashstory/sdk</code>
                </pre>

                <p>或通过CDN引入：</p>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{`<script src="https://cdn.dashstory.io/sdk/latest/dashstory.umd.js"></script>`}</code>
                </pre>

                <h2>浏览器插件</h2>
                <p>从Chrome Web Store安装DashStory插件。</p>
              </div>
            )}

            {activeSection === 'quick-start' && (
              <div className="prose max-w-none">
                <h1>快速入门</h1>
                
                <h2>1. 初始化SDK</h2>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{`import DashStory from '@dashstory/sdk';

const dashstory = new DashStory({
  apiKey: 'your-api-key',
  language: 'zh'
});

await dashstory.init();`}</code>
                </pre>

                <h2>2. 注册Panel</h2>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{`dashstory.registerPanel({
  panelId: 'revenue_trend',
  title: '月度收入趋势',
  metricType: 'time_series',
  unit: 'USD',
  timeRange: '2025-01-01~2025-12-31',
  data: [
    { t: '2025-01', v: 120000 },
    { t: '2025-02', v: 135000 }
  ]
});`}</code>
                </pre>

                <h2>3. 播放解读</h2>
                <p>按 <code>Ctrl+Shift+D</code> 打开演示模式Bar，或通过代码调用：</p>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{`// 播放所有Panel
await dashstory.playAll();

// 播放指定Panel
await dashstory.playPanel('revenue_trend');`}</code>
                </pre>
              </div>
            )}

            {activeSection === 'authentication' && (
              <div className="prose max-w-none">
                <h1>认证</h1>
                
                <h2>API Key</h2>
                <p>所有API请求需要在Header中携带API Key：</p>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
                  <code>{`Authorization: Bearer sk_live_xxxxxxxxxxxx`}</code>
                </pre>

                <h2>获取API Key</h2>
                <p>登录管理控制台，在"API Keys"页面创建新的Key。</p>

                <h2>Key类型</h2>
                <ul>
                  <li><code>sk_live_</code>：生产环境Key</li>
                  <li><code>sk_test_</code>：测试环境Key</li>
                </ul>
              </div>
            )}

            {/* Add more sections as needed */}
            {!['introduction', 'installation', 'quick-start', 'authentication'].includes(activeSection) && (
              <div className="text-center py-12 text-gray-500">
                <p>文档内容正在完善中...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

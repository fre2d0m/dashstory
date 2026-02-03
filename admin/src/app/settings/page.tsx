'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    organizationName: 'My Organization',
    defaultLanguage: 'zh',
    defaultVoice: 'professional',
    audioRetentionDays: 7,
    webhookUrl: '',
    rateLimit: 60,
  });

  const handleSave = () => {
    // TODO: 保存设置
    alert('设置已保存');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 mt-1">配置您的DashStory服务</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基础设置 */}
        <Card title="基础设置">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                组织名称
              </label>
              <input
                type="text"
                value={settings.organizationName}
                onChange={(e) => setSettings(s => ({ ...s, organizationName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                默认语言
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings(s => ({ ...s, defaultLanguage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                默认语音风格
              </label>
              <select
                value={settings.defaultVoice}
                onChange={(e) => setSettings(s => ({ ...s, defaultVoice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="professional">专业风格</option>
                <option value="friendly">友好风格</option>
                <option value="energetic">活力风格</option>
                <option value="calm">沉稳风格</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 高级设置 */}
        <Card title="高级设置">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                音频保留天数
              </label>
              <input
                type="number"
                value={settings.audioRetentionDays}
                onChange={(e) => setSettings(s => ({ ...s, audioRetentionDays: parseInt(e.target.value) }))}
                min={1}
                max={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">音频文件将在生成后保留指定天数</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API速率限制（每分钟）
              </label>
              <input
                type="number"
                value={settings.rateLimit}
                onChange={(e) => setSettings(s => ({ ...s, rateLimit: parseInt(e.target.value) }))}
                min={10}
                max={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL（可选）
              </label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                placeholder="https://your-server.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">接收任务完成通知</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Key, Plus, Copy, Trash2, Check } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production SDK',
    key: 'sk_live_xxxxxxxxxxxxxxxxxxxx',
    createdAt: '2025-01-15',
    lastUsedAt: '2025-02-03',
    isActive: true,
  },
  {
    id: '2',
    name: 'Development',
    key: 'sk_test_xxxxxxxxxxxxxxxxxxxx',
    createdAt: '2025-01-20',
    lastUsedAt: '2025-02-01',
    isActive: true,
  },
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    if (confirm('确定要撤销此API Key吗？此操作不可撤销。')) {
      setApiKeys(keys => keys.filter(k => k.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">管理您的API访问凭证</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          创建新Key
        </Button>
      </div>

      <Card>
        <div className="divide-y divide-gray-200">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{apiKey.key}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    创建于 {apiKey.createdAt}
                    {apiKey.lastUsedAt && ` · 最后使用 ${apiKey.lastUsedAt}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(apiKey.id, apiKey.key)}
                >
                  {copiedId === apiKey.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(apiKey.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="使用说明">
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>API Key用于验证SDK和插件的请求。请妥善保管您的Key，不要在客户端代码中暴露。</p>
          <ul>
            <li><strong>sk_live_</strong> 开头的Key用于生产环境</li>
            <li><strong>sk_test_</strong> 开头的Key用于测试环境</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { UsageChart } from '@/components/dashboard/UsageChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { 
  Users, 
  Zap, 
  Clock, 
  TrendingUp,
  Mic,
  Eye
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">控制台概览</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看您的DashStory使用情况</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="总调用次数"
          value="12,345"
          change="+12.5%"
          changeType="increase"
          icon={<Zap className="w-6 h-6" />}
        />
        <StatsCard
          title="活跃用户"
          value="89"
          change="+5"
          changeType="increase"
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="语音生成"
          value="3,456"
          change="+8.3%"
          changeType="increase"
          icon={<Mic className="w-6 h-6" />}
        />
        <StatsCard
          title="图像识别"
          value="2,891"
          change="+15.2%"
          changeType="increase"
          icon={<Eye className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="使用趋势" subtitle="最近30天">
          <UsageChart />
        </Card>
        <Card title="最近活动">
          <RecentActivity />
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="快速操作">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="创建API Key"
            description="为新应用生成访问凭证"
            href="/api-keys/new"
          />
          <QuickAction
            title="查看文档"
            description="SDK集成指南和API参考"
            href="/docs"
          />
          <QuickAction
            title="使用统计"
            description="查看详细的用量分析报告"
            href="/analytics"
          />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ 
  title, 
  description, 
  href 
}: { 
  title: string; 
  description: string; 
  href: string;
}) {
  return (
    <a 
      href={href}
      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </a>
  );
}

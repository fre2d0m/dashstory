import { Mic, Eye, Key, AlertCircle } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'narration',
    message: '生成了收入趋势解读',
    time: '2分钟前',
    icon: Mic,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 2,
    type: 'vision',
    message: '识别了Dashboard截图',
    time: '5分钟前',
    icon: Eye,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 3,
    type: 'api_key',
    message: '创建了新的API Key',
    time: '1小时前',
    icon: Key,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 4,
    type: 'error',
    message: 'API请求触发限流',
    time: '2小时前',
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
];

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${activity.iconBg}`}>
            <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

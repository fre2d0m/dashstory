'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: '1/28', calls: 320, audio: 180 },
  { date: '1/29', calls: 450, audio: 220 },
  { date: '1/30', calls: 380, audio: 190 },
  { date: '1/31', calls: 520, audio: 280 },
  { date: '2/1', calls: 610, audio: 350 },
  { date: '2/2', calls: 480, audio: 240 },
  { date: '2/3', calls: 550, audio: 310 },
];

export function UsageChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#667eea"
            strokeWidth={2}
            dot={false}
            name="API调用"
          />
          <Line
            type="monotone"
            dataKey="audio"
            stroke="#764ba2"
            strokeWidth={2}
            dot={false}
            name="音频生成"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

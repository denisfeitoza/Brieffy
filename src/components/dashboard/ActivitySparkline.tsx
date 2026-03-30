'use client';

import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { week: string; count: number }[];
}

export function ActivitySparkline({ data }: Props) {
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px', padding: '4px 8px' }}
            itemStyle={{ color: '#06b6d4' }}
            labelStyle={{ color: '#71717a', display: 'none' }}
            formatter={(v: unknown) => [String(v), 'briefings']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#sparkGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

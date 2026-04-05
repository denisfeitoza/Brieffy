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
              <stop offset="5%" stopColor="#ff6029" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff6029" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'var(--bg)', 
              border: '1px solid var(--bd)', 
              borderRadius: '8px', 
              fontSize: '11px', 
              padding: '4px 8px',
              color: 'var(--text)',
            }}
            itemStyle={{ color: '#ff6029' }}
            labelStyle={{ color: 'var(--text3)', display: 'none' }}
            formatter={(v: unknown) => [String(v), 'briefings']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ff6029"
            strokeWidth={2}
            fill="url(#sparkGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

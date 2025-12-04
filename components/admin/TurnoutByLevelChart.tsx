'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TurnoutData {
  level: string;
  total: number;
  voted: number;
  percentage: number;
}

interface TurnoutByLevelChartProps {
  data: TurnoutData[];
}

export default function TurnoutByLevelChart({ data }: TurnoutByLevelChartProps) {
  const chartData = data.map((item) => ({
    level: item.level,
    Voted: item.voted,
    'Not Voted': item.total - item.voted,
    'Turnout %': item.percentage,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis dataKey="level" className="text-xs fill-gray-600" tick={{ fontSize: 12 }} />
          <YAxis className="text-xs fill-gray-600" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend />
          <Bar dataKey="Voted" fill="#059669" name="Voted" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Not Voted" fill="#d1d5db" name="Not Voted" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

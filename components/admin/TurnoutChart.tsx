'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface TurnoutChartProps {
  voted: number;
  notVoted: number;
  votedPercentage: number;
}

export default function TurnoutChart({ voted, notVoted, votedPercentage }: TurnoutChartProps) {
  const turnoutData = [
    { name: 'Voted', value: voted, fill: '#22c55e' },
    { name: 'Not Voted', value: notVoted, fill: '#e5e7eb' },
  ];

  return (
    <>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={turnoutData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {turnoutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats below chart */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{votedPercentage}%</p>
          <p className="text-sm text-muted-foreground">Turnout</p>
        </div>
      </div>
    </>
  );
}

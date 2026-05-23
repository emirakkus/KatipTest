import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CompareChartProps {
  data: { session: number; accuracy: number; wpm: number; mistakes: number }[];
  darkMode: boolean;
}

export const CompareChart = memo(function CompareChart({ data, darkMode }: CompareChartProps) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis dataKey="session" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={10} />
          <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? '#1f2937' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="Doğruluk %" />
          <Line type="monotone" dataKey="wpm" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="WPM" />
          <Line type="monotone" dataKey="mistakes" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Hata" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

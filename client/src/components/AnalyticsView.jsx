import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics', { method: 'POST' })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p>Анализирую ваши покупки...</p>
      </div>
    );
  }

  if (!data || !data.categories) {
    return <div className="text-center p-4">Нет данных за эту неделю.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span>📊</span> Аналитика
      </h2>

      {/* Pie Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.categories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Advice Card */}
      <div className="mt-6 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h3 className="font-semibold text-indigo-900">Совет от ИИ</h3>
            <p className="text-indigo-800 text-sm mt-1">{data.advice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

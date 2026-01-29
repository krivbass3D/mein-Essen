import React, { useEffect, useState } from 'react';

const BudgetView = ({ refreshTrigger }) => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/budget');
      const data = await res.json();
      setBudget(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [refreshTrigger]);

  if (loading) return <div className="text-center text-slate-400 p-4">Загрузка бюджета...</div>;
  if (!budget) return null;

  const percentSpent = Math.min((budget.spent / budget.limit) * 100, 100);
  const isDanger = percentSpent > 85;

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Недельный Бюджет</h2>
          <p className="text-xs text-slate-400">С {budget.weekStart}</p>
        </div>
        <div className={`text-2xl font-black ${isDanger ? 'text-rose-500' : 'text-emerald-500'}`}>
          €{budget.remaining.toFixed(2)}
        </div>
      </div>

      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${percentSpent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-medium text-slate-600">
        <span>Потрачено: €{budget.spent.toFixed(2)}</span>
        <span>Лимит: €{budget.limit}</span>
      </div>
    </div>
  );
};

export default BudgetView;

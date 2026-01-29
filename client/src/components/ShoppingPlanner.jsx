import React, { useState } from 'react';

const ShoppingPlanner = () => {
  const [wishes, setWishes] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await fetch('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishes }),
      });
      
      if (!res.ok) throw new Error('Planning failed');
      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      alert('Ошибка при создании плана: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4">План на завтра 📅</h2>
      
      <textarea
        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
        rows="2"
        placeholder="Пожелания? (например: Рыба, Паста...)"
        value={wishes}
        onChange={(e) => setWishes(e.target.value)}
      />

      <button
        onClick={handlePlan}
        disabled={loading}
        className="w-full mt-3 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:bg-slate-400 disabled:shadow-none"
      >
        {loading ? 'Думаю... 🧠' : 'Создать список покупок'}
      </button>

      {plan && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed animation-fade-in-up">
          {plan}
        </div>
      )}
    </div>
  );
};

export default ShoppingPlanner;

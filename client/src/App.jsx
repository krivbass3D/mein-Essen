import React, { useState } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import BudgetView from './components/BudgetView';
import ShoppingPlanner from './components/ShoppingPlanner';
import AnalyticsView from './components/AnalyticsView';

function App() {
  const [refreshBudget, setRefreshBudget] = useState(0);
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'analytics'

  const handleReceiptSaved = () => {
    setRefreshBudget(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          mein <span className="text-emerald-500">Essen</span>
        </h1>
        <p className="text-slate-500 mt-2">Умный трекер продуктов</p>
      </header>
      
      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg shadow-sm">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'main' 
              ? 'bg-emerald-500 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏠 Главная
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics' 
              ? 'bg-indigo-500 text-white shadow' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📊 Аналитика
        </button>
      </div>

      <main className="w-full max-w-md space-y-6">
        {activeTab === 'main' ? (
          <>
            <BudgetView refreshTrigger={refreshBudget} />
            <ShoppingPlanner />
            <ReceiptUpload onSaved={handleReceiptSaved} />
          </>
        ) : (
          <AnalyticsView />
        )}
      </main>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import BudgetView from './components/BudgetView';
import ShoppingPlanner from './components/ShoppingPlanner';

function App() {
  const [refreshBudget, setRefreshBudget] = useState(0);

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
      
      <main className="w-full max-w-md space-y-6">
        <BudgetView refreshTrigger={refreshBudget} />
        <ShoppingPlanner />
        <ReceiptUpload onSaved={handleReceiptSaved} />
      </main>
    </div>
  );
}

export default App;

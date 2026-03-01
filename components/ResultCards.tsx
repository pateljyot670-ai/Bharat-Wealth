
import React from 'react';
import { SIPResults } from '../types';
import { formatCurrency } from '../utils/sipCalculations';

interface Props {
  results: SIPResults;
}

const ResultCards: React.FC<Props> = ({ results }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Invested</p>
        <p key={`invested-${results.totalInvested}`} className="text-2xl font-black text-slate-900 dark:text-white animate-value-update">
          {formatCurrency(results.totalInvested)}
        </p>
      </div>
      <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Estimated Yield</p>
        <p key={`returns-${results.estimatedReturns}`} className="text-2xl font-black text-emerald-600 dark:text-emerald-500 animate-value-update">
          {formatCurrency(results.estimatedReturns)}
        </p>
      </div>
      <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Terminal Value</p>
        <p key={`total-${results.totalValue}`} className="text-2xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
          {formatCurrency(results.totalValue)}
        </p>
      </div>
    </div>
  );
};

export default ResultCards;

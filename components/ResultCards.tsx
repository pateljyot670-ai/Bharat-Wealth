
import React from 'react';
import { SIPResults } from '../types';
import { formatCurrency } from '../utils/sipCalculations';

interface Props {
  results: SIPResults;
}

const ResultCards: React.FC<Props> = ({ results }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 rounded-2xl shadow-sm border flex flex-col items-center text-center transition-colors dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200/80 hover:shadow-md">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Total Invested</p>
        <p 
          key={`invested-${results.totalInvested}`} 
          className="text-2xl font-extrabold dark:text-gray-200 text-gray-800 animate-value-update"
        >
          {formatCurrency(results.totalInvested)}
        </p>
      </div>
      <div className="p-5 rounded-2xl shadow-sm border flex flex-col items-center text-center transition-colors dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200/80 hover:shadow-md">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Est. Returns</p>
        <p 
          key={`returns-${results.estimatedReturns}`} 
          className="text-2xl font-extrabold dark:text-emerald-400 text-emerald-600 animate-value-update"
        >
          {formatCurrency(results.estimatedReturns)}
        </p>
      </div>
      <div className="p-5 rounded-2xl shadow-sm border flex flex-col items-center text-center transition-colors dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200/80 hover:shadow-md">
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">Total Value</p>
        <p 
          key={`total-${results.totalValue}`} 
          className="text-2xl font-extrabold dark:text-indigo-400 text-indigo-600 animate-value-update"
        >
          {formatCurrency(results.totalValue)}
        </p>
      </div>
    </div>
  );
};

export default ResultCards;

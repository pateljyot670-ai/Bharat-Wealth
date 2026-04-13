
import React from 'react';
import { SIPResults, LoanResults, SWPResults, CalculationMode } from '../types';
import { formatCurrency } from '../utils/sipCalculations';

interface Props {
  mode: CalculationMode;
  results: SIPResults | LoanResults | SWPResults;
}

const ResultCards: React.FC<Props> = ({ mode, results }) => {
  if (mode === 'SIP' || mode === 'Lumpsum') {
    const res = results as SIPResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Invested</p>
          <p key={`invested-${res.totalInvested}`} className="text-2xl font-black text-slate-900 dark:text-white animate-value-update">
            {formatCurrency(res.totalInvested)}
          </p>
        </div>
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Estimated Yield</p>
          <p key={`returns-${res.estimatedReturns}`} className="text-2xl font-black text-emerald-600 dark:text-emerald-500 animate-value-update">
            {formatCurrency(res.estimatedReturns)}
          </p>
        </div>
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Terminal Value</p>
          <p key={`total-${res.totalValue}`} className="text-2xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.totalValue)}
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'Loan') {
    const res = results as LoanResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Monthly EMI</p>
          <p key={`emi-${res.monthlyEMI}`} className="text-2xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.monthlyEMI)}
          </p>
        </div>
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Interest</p>
          <p key={`interest-${res.totalInterest}`} className="text-2xl font-black text-rose-600 dark:text-rose-500 animate-value-update">
            {formatCurrency(res.totalInterest)}
          </p>
        </div>
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Payment</p>
          <p key={`payment-${res.totalPayment}`} className="text-2xl font-black text-slate-900 dark:text-white animate-value-update">
            {formatCurrency(res.totalPayment)}
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'SWP') {
    const res = results as SWPResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Withdrawn</p>
          <p key={`withdrawn-${res.totalWithdrawn}`} className="text-2xl font-black text-emerald-600 dark:text-emerald-500 animate-value-update">
            {formatCurrency(res.totalWithdrawn)}
          </p>
        </div>
        <div className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Final Balance</p>
          <p key={`balance-${res.finalBalance}`} className="text-2xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.finalBalance)}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultCards;


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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0 w-full">
        {/* Total Invested */}
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total Invested</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Principal</span>
          </div>
          <p key={`invested-${res.totalInvested}`} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white animate-value-update">
            {formatCurrency(res.totalInvested)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Your out-of-pocket investment</p>
        </div>

        {/* Estimated Yield */}
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Estimated Yield</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Growth</span>
          </div>
          <p key={`returns-${res.estimatedReturns}`} className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 animate-value-update">
            +{formatCurrency(res.estimatedReturns)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Compound growth generated</p>
        </div>

        {/* Terminal Value (Nominal) */}
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Terminal Value</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">Future ₹</span>
          </div>
          <p key={`total-${res.totalValue}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.totalValue)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Nominal portfolio wealth at maturity</p>
        </div>

        {/* Real Purchasing Power (Inflation-Adjusted) */}
        <div className="p-5 sm:p-6 rounded-2xl border bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-800 dark:text-teal-300">Real Purchasing Power</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">Today's ₹</span>
          </div>
          <p key={`real-${res.realValue}`} className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300 animate-value-update">
            {formatCurrency(res.realValue)}
          </p>
          <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 mt-2 font-medium">
            At {res.inflationRate}% inflation (real value)
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'Loan') {
    const res = results as LoanResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0 w-full">
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Monthly EMI</p>
          <p key={`emi-${res.monthlyEMI}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.monthlyEMI)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Fixed monthly installment</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Interest</p>
          <p key={`interest-${res.totalInterest}`} className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 animate-value-update">
            {formatCurrency(res.totalInterest)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Interest charges over tenure</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Payment</p>
          <p key={`payment-${res.totalPayment}`} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white animate-value-update">
            {formatCurrency(res.totalPayment)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Principal + Total Interest</p>
        </div>
      </div>
    );
  }

  if (mode === 'SWP') {
    const res = results as SWPResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0 w-full">
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Total Withdrawn</p>
          <p key={`withdrawn-${res.totalWithdrawn}`} className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 animate-value-update">
            {formatCurrency(res.totalWithdrawn)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Total systematic income withdrawn</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Final Balance (Nominal)</p>
          <p key={`balance-${res.finalBalance}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.finalBalance)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Nominal portfolio balance remaining</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-800 dark:text-teal-300">Real Final Balance</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">Today's ₹</span>
          </div>
          <p key={`real-bal-${res.realFinalBalance}`} className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300 animate-value-update">
            {formatCurrency(res.realFinalBalance)}
          </p>
          <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 mt-2 font-medium">
            At {res.inflationRate}% inflation (real value)
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultCards;

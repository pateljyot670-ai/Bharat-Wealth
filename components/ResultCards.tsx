
import React, { useState, useMemo } from 'react';
import { SIPResults, LoanResults, SWPResults, CalculationMode, TaxHoldingPeriod } from '../types';
import { formatCurrency, calculateCapitalGainsTax } from '../utils/sipCalculations';

interface Props {
  mode: CalculationMode;
  results: SIPResults | LoanResults | SWPResults;
  periodYears?: number;
  showTaxImpact?: boolean;
  setShowTaxImpact?: (show: boolean) => void;
  taxHoldingPeriod?: TaxHoldingPeriod;
  setTaxHoldingPeriod?: (period: TaxHoldingPeriod) => void;
}

const ResultCards: React.FC<Props> = ({ 
  mode, 
  results,
  periodYears = 10,
  showTaxImpact: controlledShowTax,
  setShowTaxImpact: controlledSetShowTax,
  taxHoldingPeriod: controlledHoldingPeriod,
  setTaxHoldingPeriod: controlledSetHoldingPeriod
}) => {
  // Support both controlled and uncontrolled states
  const [internalShowTax, setInternalShowTax] = useState(false);
  const [internalHoldingPeriod, setInternalHoldingPeriod] = useState<TaxHoldingPeriod>(
    periodYears > 1 ? 'long-term' : 'short-term'
  );

  const isTaxActive = controlledShowTax !== undefined ? controlledShowTax : internalShowTax;
  const toggleTax = (val: boolean) => {
    if (controlledSetShowTax) controlledSetShowTax(val);
    else setInternalShowTax(val);
  };

  const holdingPeriod = controlledHoldingPeriod !== undefined ? controlledHoldingPeriod : internalHoldingPeriod;
  const setPeriod = (p: TaxHoldingPeriod) => {
    if (controlledSetHoldingPeriod) controlledSetHoldingPeriod(p);
    else setInternalHoldingPeriod(p);
  };

  // Capital gains tax calculation for investments (SIP, Lumpsum, SWP)
  const taxData = useMemo(() => {
    if (mode === 'Loan') return null;
    let gains = 0;
    let invested = 0;
    if (mode === 'SIP' || mode === 'Lumpsum') {
      const res = results as SIPResults;
      gains = res.estimatedReturns;
      invested = res.totalInvested;
    } else if (mode === 'SWP') {
      const res = results as SWPResults;
      // In SWP, net returns generated over tenure
      gains = Math.max(0, (res.totalWithdrawn + res.finalBalance) - (results as any).totalInvestment || 0);
      invested = (results as any).totalInvestment || 0;
    }
    return calculateCapitalGainsTax(gains, invested, holdingPeriod);
  }, [mode, results, holdingPeriod]);

  if (mode === 'SIP' || mode === 'Lumpsum') {
    const res = results as SIPResults;
    return (
      <div className="space-y-4 w-full min-w-0">
        {/* Tax Impact Toggle Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-sky-300 font-black text-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Tax Impact Analysis
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  Budget 2024
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Estimate capital gains tax (LTCG / STCG) on your projected returns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isTaxActive ? 'Applied' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isTaxActive}
              onClick={() => toggleTax(!isTaxActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isTaxActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isTaxActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tax Holding Period Selector & Breakdown when Active */}
        {isTaxActive && taxData && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Indian Holding Period Rule
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {holdingPeriod === 'long-term' ? 'Long-Term Capital Gains (LTCG)' : 'Short-Term Capital Gains (STCG)'}
                </p>
              </div>

              {/* Segmented Control for Holding Period */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPeriod('long-term')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    holdingPeriod === 'long-term'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Long-Term (&gt; 1 Yr · 12.5%)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('short-term')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    holdingPeriod === 'short-term'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Short-Term (≤ 1 Yr · 20%)
                </button>
              </div>
            </div>

            {/* 4 Tax Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Est. Tax Liability */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Estimated Tax
                </p>
                <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxData.taxAmount)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {holdingPeriod === 'long-term' ? '12.5% on > ₹1.25L' : '20% flat tax'}
                </p>
              </div>

              {/* Effective Tax Rate */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Effective Rate
                </p>
                <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {taxData.effectiveTaxRate}%
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  On total capital gains
                </p>
              </div>

              {/* Post-Tax Net Returns */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Post-Tax Gain
                </p>
                <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCurrency(taxData.netReturns)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Net profit after tax
                </p>
              </div>

              {/* Net In-Hand Corpus */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Net In-Hand Wealth
                </p>
                <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(taxData.netTotalValue)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Principal + Net Gain
                </p>
              </div>
            </div>

            {/* Explanatory Rule Footer */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <span className="text-indigo-600 dark:text-sky-300 font-bold shrink-0">ℹ️ Rule:</span>
              <span>
                {holdingPeriod === 'long-term' 
                  ? `Section 112A: ₹1,25,000 exemption applied. Taxable gain is ${formatCurrency(taxData.taxableGains)} taxed at 12.5%.`
                  : 'Section 111A: Short-term equity capital gains are taxed flat at 20% on the full gain with no basic exemption.'
                }
              </span>
            </div>
          </div>
        )}

        {/* Standard 4 Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0 w-full">
          {/* Total Invested */}
          <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">Total Invested</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">Principal</span>
            </div>
            <p key={`invested-${res.totalInvested}`} className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 animate-value-update">
              {formatCurrency(res.totalInvested)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Your out-of-pocket investment</p>
          </div>

          {/* Estimated Yield */}
          <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">Estimated Yield</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Growth</span>
            </div>
            <p key={`returns-${res.estimatedReturns}`} className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 animate-value-update">
              +{formatCurrency(res.estimatedReturns)}
            </p>
            {isTaxActive && taxData ? (
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                Post-tax: +{formatCurrency(taxData.netReturns)}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Compound growth generated</p>
            )}
          </div>

          {/* Terminal Value (Nominal) */}
          <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">Terminal Value</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">Future ₹</span>
            </div>
            <p key={`total-${res.totalValue}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
              {formatCurrency(res.totalValue)}
            </p>
            {isTaxActive && taxData ? (
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mt-2">
                Net in-hand: {formatCurrency(taxData.netTotalValue)}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Nominal portfolio wealth at maturity</p>
            )}
          </div>

          {/* Real Purchasing Power (Inflation-Adjusted) */}
          <div className="p-5 sm:p-6 rounded-2xl border bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">Real Purchasing Power</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">Today's ₹</span>
            </div>
            <p key={`real-${res.realValue}`} className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 animate-value-update">
              {formatCurrency(res.realValue)}
            </p>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 mt-2 font-medium">
              At {res.inflationRate}% inflation (real value)
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'Loan') {
    const res = results as LoanResults;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0 w-full">
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300 mb-2">Monthly EMI</p>
          <p key={`emi-${res.monthlyEMI}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
            {formatCurrency(res.monthlyEMI)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Fixed monthly installment</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300 mb-2">Total Interest</p>
          <p key={`interest-${res.totalInterest}`} className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 animate-value-update">
            {formatCurrency(res.totalInterest)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Interest charges over tenure</p>
        </div>
        <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300 mb-2">Total Payment</p>
          <p key={`payment-${res.totalPayment}`} className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 animate-value-update">
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
      <div className="space-y-4 w-full min-w-0">
        {/* Tax Impact Toggle Bar for SWP */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-sky-300 font-black text-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Tax Impact Analysis
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  Budget 2024
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Estimate capital gains tax on overall portfolio returns generated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isTaxActive ? 'Applied' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isTaxActive}
              onClick={() => toggleTax(!isTaxActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isTaxActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isTaxActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SWP Tax Breakdown when Active */}
        {isTaxActive && taxData && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Indian Holding Period Rule
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {holdingPeriod === 'long-term' ? 'Long-Term Capital Gains (LTCG)' : 'Short-Term Capital Gains (STCG)'}
                </p>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPeriod('long-term')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    holdingPeriod === 'long-term'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Long-Term (&gt; 1 Yr · 12.5%)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('short-term')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    holdingPeriod === 'short-term'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Short-Term (≤ 1 Yr · 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Estimated Tax
                </p>
                <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(taxData.taxAmount)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {holdingPeriod === 'long-term' ? '12.5% on > ₹1.25L' : '20% flat tax'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Effective Rate
                </p>
                <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {taxData.effectiveTaxRate}%
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  On overall capital gains
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Post-Tax Returns
                </p>
                <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  +{formatCurrency(taxData.netReturns)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Gains after tax
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-800 dark:text-sky-300">
                  Net Wealth Output
                </p>
                <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(taxData.netTotalValue)}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Total post-tax wealth
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0 w-full">
          <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300 mb-2">Total Withdrawn</p>
            <p key={`withdrawn-${res.totalWithdrawn}`} className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 animate-value-update">
              {formatCurrency(res.totalWithdrawn)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Total systematic income withdrawn</p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300 mb-2">Final Balance (Nominal)</p>
            <p key={`balance-${res.finalBalance}`} className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 animate-value-update">
              {formatCurrency(res.finalBalance)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Nominal portfolio balance remaining</p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl border bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/80 dark:border-teal-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-sky-300">Real Final Balance</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">Today's ₹</span>
            </div>
            <p key={`real-bal-${res.realFinalBalance}`} className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 animate-value-update">
              {formatCurrency(res.realFinalBalance)}
            </p>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 mt-2 font-medium">
              At {res.inflationRate}% inflation (real value)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultCards;

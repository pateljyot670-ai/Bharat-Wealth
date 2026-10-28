
import React, { useState, useEffect } from 'react';
import { SIPInputs, LoanInputs, SWPInputs, CalculationMode, Frequency } from '../types';
import { AlertCircle } from 'lucide-react';

interface Props {
  mode: CalculationMode;
  setMode: (mode: CalculationMode) => void;
  sipInputs: SIPInputs;
  setSipInputs: (inputs: SIPInputs) => void;
  loanInputs: LoanInputs;
  setLoanInputs: (inputs: LoanInputs) => void;
  swpInputs: SWPInputs;
  setSwpInputs: (inputs: SWPInputs) => void;
  onReset: () => void;
}

interface Errors {
  [key: string]: string | undefined;
}

const InputSection: React.FC<Props> = ({ 
  mode, setMode, 
  sipInputs, setSipInputs, 
  loanInputs, setLoanInputs, 
  swpInputs, setSwpInputs, 
  onReset 
}) => {
  const [errors, setErrors] = useState<Errors>({});

  const validate = (name: string, value: number) => {
    let error = '';
    if (mode === 'SIP' || mode === 'Lumpsum') {
      if (name === 'investmentAmount') {
        const min = mode === 'SIP' ? 100 : 5000;
        const max = mode === 'SIP' ? 500000 : 10000000;
        if (value < min) error = `Minimum ₹${min.toLocaleString('en-IN')}`;
        if (value > max) error = `Maximum ₹${(max / 100000).toFixed(0)}L`;
      } else if (name === 'expectedReturn') {
        if (value < 1) error = 'Min 1%';
        if (value > 30) error = 'Max 30%';
      } else if (name === 'periodYears') {
        if (value < 1) error = 'Min 1 Yr';
        if (value > 50) error = 'Max 50 Yrs';
      } else if (name === 'inflationRate') {
        if (value < 0) error = 'Min 0%';
        if (value > 15) error = 'Max 15%';
      }
    } else if (mode === 'Loan') {
      if (name === 'loanAmount') {
        if (value < 10000) error = 'Min ₹10k';
        if (value > 100000000) error = 'Max ₹10Cr';
      } else if (name === 'interestRate') {
        if (value < 1) error = 'Min 1%';
        if (value > 20) error = 'Max 20%';
      } else if (name === 'tenureYears') {
        if (value < 1) error = 'Min 1 Yr';
        if (value > 30) error = 'Max 30 Yrs';
      }
    } else if (mode === 'SWP') {
      if (name === 'totalInvestment') {
        if (value < 10000) error = 'Min ₹10k';
        if (value > 100000000) error = 'Max ₹10Cr';
      } else if (name === 'withdrawalAmount') {
        if (value < 500) error = 'Min ₹500';
      } else if (name === 'expectedReturn') {
        if (value < 1) error = 'Min 1%';
        if (value > 30) error = 'Max 30%';
      } else if (name === 'periodYears') {
        if (value < 1) error = 'Min 1 Yr';
        if (value > 50) error = 'Max 50 Yrs';
      } else if (name === 'inflationRate') {
        if (value < 0) error = 'Min 0%';
        if (value > 15) error = 'Max 15%';
      }
    }
    return error;
  };

  const handleValueChange = (name: string, valueStr: string) => {
    const value = parseFloat(valueStr);
    const safeValue = isNaN(value) ? 0 : value;
    
    if (mode === 'SIP' || mode === 'Lumpsum') {
      setSipInputs({ ...sipInputs, [name]: safeValue });
    } else if (mode === 'Loan') {
      setLoanInputs({ ...loanInputs, [name]: safeValue });
    } else if (mode === 'SWP') {
      setSwpInputs({ ...swpInputs, [name]: safeValue });
    }
    
    setErrors({ ...errors, [name]: validate(name, safeValue) });
  };

  const handleModeChange = (newMode: CalculationMode) => {
    setMode(newMode);
    if (newMode === 'SIP' || newMode === 'Lumpsum') {
      setSipInputs({ ...sipInputs, mode: newMode });
    }
    setErrors({});
  };

  const handleFrequencyChange = (frequency: Frequency) => {
    setSipInputs({ ...sipInputs, frequency });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const rect = input.getBoundingClientRect();
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const value = parseFloat(input.value);
    
    const thumbWidth = 24;
    const percent = (value - min) / (max - min);
    
    const effectiveWidth = rect.width - thumbWidth;
    const thumbCenterX = (percent * effectiveWidth) + (thumbWidth / 2);
    const clickX = e.clientX - rect.left;

    const threshold = 18; 
    if (Math.abs(clickX - thumbCenterX) > threshold) {
      e.preventDefault();
    }
  };

  const frequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];
  const displayValue = (val: number) => (val === 0 ? '' : val);

  return (
    <div className="space-y-6 p-5 sm:p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] border transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-w-0 w-full overflow-hidden">
      {/* Mode Switcher */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl dark:bg-slate-800/90 bg-slate-100 border border-slate-200/80 dark:border-slate-700/60">
        {(['SIP', 'Lumpsum', 'Loan', 'SWP'] as CalculationMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`py-2 px-1 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              mode === m 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 dark:bg-slate-700 dark:text-indigo-300 dark:border-transparent' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {m === 'Lumpsum' ? 'Lump' : m}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200"></div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {mode} Details
          </h2>
        </div>
        <button 
          onClick={() => {
            onReset();
            setErrors({});
          }}
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {(mode === 'SIP' || mode === 'Lumpsum') && (
        <>
          {mode === 'SIP' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Frequency</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleFrequencyChange(freq)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                      sipInputs.frequency === freq
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                        : 'bg-slate-50 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Investment Amount */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {mode === 'SIP' ? `${sipInputs.frequency} Amount` : 'One-time Amount'}
              </label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.investmentAmount 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950'
                }`}>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-1 text-base">₹</span>
                <input
                  type="number"
                  value={displayValue(sipInputs.investmentAmount)}
                  onChange={(e) => handleValueChange('investmentAmount', e.target.value)}
                  className={`w-28 bg-transparent text-lg font-black ${errors.investmentAmount ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'} border-none outline-none text-right`}
                />
              </div>
            </div>
            <input
              type="range"
              min={mode === 'SIP' ? 100 : 5000}
              max={mode === 'SIP' ? 500000 : 10000000}
              step={mode === 'SIP' ? 100 : 5000}
              value={sipInputs.investmentAmount}
              onInput={(e) => handleValueChange('investmentAmount', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Expected Return */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Return Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.expectedReturn 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(sipInputs.expectedReturn)}
                  onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
                  className={`w-16 bg-transparent text-lg font-black ${errors.expectedReturn ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'} border-none outline-none text-right`}
                />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={sipInputs.expectedReturn}
              onInput={(e) => handleValueChange('expectedReturn', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Period */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Time Period</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.periodYears 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(sipInputs.periodYears)}
                  onChange={(e) => handleValueChange('periodYears', e.target.value)}
                  className={`w-12 bg-transparent text-lg font-black ${errors.periodYears ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'} border-none outline-none text-right`}
                />
                <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={sipInputs.periodYears}
              onInput={(e) => handleValueChange('periodYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Expected Inflation Rate Slider */}
          <div className="space-y-3 pt-3 border-t border-slate-200/90 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Expected Inflation Rate</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                    Real Value
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Adjusts terminal wealth for purchasing power
                </p>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.inflationRate 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(sipInputs.inflationRate)}
                  onChange={(e) => handleValueChange('inflationRate', e.target.value)}
                  className={`w-14 bg-transparent text-lg font-black ${errors.inflationRate ? 'text-red-700 dark:text-red-400' : 'text-teal-700 dark:text-teal-400'} border-none outline-none text-right`}
                  step="0.5"
                />
                <span className="text-teal-600 dark:text-teal-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={sipInputs.inflationRate}
              onInput={(e) => handleValueChange('inflationRate', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-teal-600 bg-slate-200 dark:bg-slate-700"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
              {[
                { label: '0% None', val: 0 },
                { label: '4% Low', val: 4 },
                { label: '6% Avg CPI', val: 6 },
                { label: '8% High', val: 8 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleValueChange('inflationRate', p.val.toString())}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    sipInputs.inflationRate === p.val
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === 'Loan' && (
        <>
          {/* Loan Amount */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Loan Amount</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.loanAmount 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950'
                }`}>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-1 text-base">₹</span>
                <input
                  type="number"
                  value={displayValue(loanInputs.loanAmount)}
                  onChange={(e) => handleValueChange('loanAmount', e.target.value)}
                  className="w-28 bg-transparent text-lg font-black text-slate-900 dark:text-white border-none outline-none text-right"
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="10000000"
              step="10000"
              value={loanInputs.loanAmount}
              onInput={(e) => handleValueChange('loanAmount', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Interest Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.interestRate 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 dark:focus-within:ring-rose-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(loanInputs.interestRate)}
                  onChange={(e) => handleValueChange('interestRate', e.target.value)}
                  className="w-16 bg-transparent text-lg font-black text-rose-700 dark:text-rose-400 border-none outline-none text-right"
                />
                <span className="text-rose-600 dark:text-rose-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={loanInputs.interestRate}
              onInput={(e) => handleValueChange('interestRate', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-rose-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Tenure */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Tenure</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.tenureYears 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(loanInputs.tenureYears)}
                  onChange={(e) => handleValueChange('tenureYears', e.target.value)}
                  className="w-12 bg-transparent text-lg font-black text-amber-700 dark:text-amber-400 border-none outline-none text-right"
                />
                <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={loanInputs.tenureYears}
              onInput={(e) => handleValueChange('tenureYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500 bg-slate-200 dark:bg-slate-700"
            />
          </div>
        </>
      )}

      {mode === 'SWP' && (
        <>
          {/* Total Investment */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Total Investment</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.totalInvestment 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950'
                }`}>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold mr-1 text-base">₹</span>
                <input
                  type="number"
                  value={displayValue(swpInputs.totalInvestment)}
                  onChange={(e) => handleValueChange('totalInvestment', e.target.value)}
                  className="w-28 bg-transparent text-lg font-black text-slate-900 dark:text-white border-none outline-none text-right"
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="10000000"
              step="10000"
              value={swpInputs.totalInvestment}
              onInput={(e) => handleValueChange('totalInvestment', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Withdrawal</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.withdrawalAmount 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100 dark:focus-within:ring-rose-950'
                }`}>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold mr-1 text-base">₹</span>
                <input
                  type="number"
                  value={displayValue(swpInputs.withdrawalAmount)}
                  onChange={(e) => handleValueChange('withdrawalAmount', e.target.value)}
                  className="w-28 bg-transparent text-lg font-black text-rose-700 dark:text-rose-400 border-none outline-none text-right"
                />
              </div>
            </div>
            <input
              type="range"
              min="500"
              max="500000"
              step="500"
              value={swpInputs.withdrawalAmount}
              onInput={(e) => handleValueChange('withdrawalAmount', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-rose-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Expected Return */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Return Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.expectedReturn 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(swpInputs.expectedReturn)}
                  onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
                  className="w-16 bg-transparent text-lg font-black text-emerald-700 dark:text-emerald-400 border-none outline-none text-right"
                />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={swpInputs.expectedReturn}
              onInput={(e) => handleValueChange('expectedReturn', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Period */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Time Period</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.periodYears 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(swpInputs.periodYears)}
                  onChange={(e) => handleValueChange('periodYears', e.target.value)}
                  className="w-12 bg-transparent text-lg font-black text-amber-700 dark:text-amber-400 border-none outline-none text-right"
                />
                <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={swpInputs.periodYears}
              onInput={(e) => handleValueChange('periodYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Expected Inflation Rate Slider for SWP */}
          <div className="space-y-3 pt-3 border-t border-slate-200/90 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>Expected Inflation Rate</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                    Real Value
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Adjusts final corpus balance for purchasing power
                </p>
              </div>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.inflationRate 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-950'
                }`}>
                <input
                  type="number"
                  value={displayValue(swpInputs.inflationRate)}
                  onChange={(e) => handleValueChange('inflationRate', e.target.value)}
                  className={`w-14 bg-transparent text-lg font-black ${errors.inflationRate ? 'text-red-700 dark:text-red-400' : 'text-teal-700 dark:text-teal-400'} border-none outline-none text-right`}
                  step="0.5"
                />
                <span className="text-teal-600 dark:text-teal-400 font-extrabold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={swpInputs.inflationRate}
              onInput={(e) => handleValueChange('inflationRate', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-teal-600 bg-slate-200 dark:bg-slate-700"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
              {[
                { label: '0% None', val: 0 },
                { label: '4% Low', val: 4 },
                { label: '6% Avg CPI', val: 6 },
                { label: '8% High', val: 8 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleValueChange('inflationRate', p.val.toString())}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    swpInputs.inflationRate === p.val
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InputSection;


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
    <div className="space-y-6 p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800 bg-white border-slate-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl dark:bg-slate-800 bg-slate-200/50">
          {(['SIP', 'Lumpsum', 'Loan', 'SWP'] as CalculationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                mode === m 
                  ? 'dark:bg-slate-700 bg-white dark:text-indigo-400 text-indigo-700 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {m === 'Lumpsum' ? 'Lump' : m}
            </button>
          ))}
        </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200"></div>
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">
            {mode} Details
          </h2>
        </div>
        <button 
          onClick={() => {
            onReset();
            setErrors({});
          }}
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border dark:border-slate-700 border-slate-200 dark:text-slate-400 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Reset
        </button>
      </div>

      {(mode === 'SIP' || mode === 'Lumpsum') && (
        <>
          {mode === 'SIP' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Frequency</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleFrequencyChange(freq)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all duration-200 ${
                      sipInputs.frequency === freq
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/50'
                        : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-600 text-slate-700 dark:border-slate-700 border-slate-200 hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-white'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Investment Amount */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">
                {mode === 'SIP' ? `${sipInputs.frequency} Amount` : 'One-time Amount'}
              </label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.investmentAmount ? 'bg-red-50/10 border-red-200/30' : 'bg-indigo-50/10 border-indigo-200/50'
                } border focus-within:ring-4`}>
                <span className={`${errors.investmentAmount ? 'text-red-500' : 'text-indigo-500'} font-bold mr-1`}>₹</span>
                <input
                  type="number"
                  value={displayValue(sipInputs.investmentAmount)}
                  onChange={(e) => handleValueChange('investmentAmount', e.target.value)}
                  className={`w-24 bg-transparent text-lg font-bold ${errors.investmentAmount ? 'text-red-700' : 'text-indigo-700 dark:text-indigo-400'} border-none outline-none text-right`}
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
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Expected Return */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Return Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.expectedReturn ? 'bg-red-50/10 border-red-200/30' : 'bg-emerald-50/10 border-emerald-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(sipInputs.expectedReturn)}
                  onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
                  className={`w-14 bg-transparent text-lg font-bold ${errors.expectedReturn ? 'text-red-700' : 'text-emerald-700 dark:text-emerald-400'} border-none outline-none text-right`}
                />
                <span className={`${errors.expectedReturn ? 'text-red-500' : 'text-emerald-500'} font-bold ml-1`}>%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={sipInputs.expectedReturn}
              onInput={(e) => handleValueChange('expectedReturn', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Period */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Time Period</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.periodYears ? 'bg-red-50/10 border-red-200/30' : 'bg-amber-50/10 border-amber-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(sipInputs.periodYears)}
                  onChange={(e) => handleValueChange('periodYears', e.target.value)}
                  className={`w-10 bg-transparent text-lg font-bold ${errors.periodYears ? 'text-red-700' : 'text-amber-700 dark:text-amber-400'} border-none outline-none text-right`}
                />
                <span className={`${errors.periodYears ? 'text-red-500' : 'text-amber-500'} font-bold ml-1`}>Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={sipInputs.periodYears}
              onInput={(e) => handleValueChange('periodYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500"
            />
          </div>
        </>
      )}

      {mode === 'Loan' && (
        <>
          {/* Loan Amount */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Loan Amount</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.loanAmount ? 'bg-red-50/10 border-red-200/30' : 'bg-indigo-50/10 border-indigo-200/50'
                } border focus-within:ring-4`}>
                <span className="text-indigo-500 font-bold mr-1">₹</span>
                <input
                  type="number"
                  value={displayValue(loanInputs.loanAmount)}
                  onChange={(e) => handleValueChange('loanAmount', e.target.value)}
                  className="w-24 bg-transparent text-lg font-bold text-indigo-700 dark:text-indigo-400 border-none outline-none text-right"
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
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Interest Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.interestRate ? 'bg-red-50/10 border-red-200/30' : 'bg-emerald-50/10 border-emerald-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(loanInputs.interestRate)}
                  onChange={(e) => handleValueChange('interestRate', e.target.value)}
                  className="w-14 bg-transparent text-lg font-bold text-emerald-700 dark:text-emerald-400 border-none outline-none text-right"
                />
                <span className="text-emerald-500 font-bold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={loanInputs.interestRate}
              onInput={(e) => handleValueChange('interestRate', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Tenure */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Tenure</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.tenureYears ? 'bg-red-50/10 border-red-200/30' : 'bg-amber-50/10 border-amber-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(loanInputs.tenureYears)}
                  onChange={(e) => handleValueChange('tenureYears', e.target.value)}
                  className="w-10 bg-transparent text-lg font-bold text-amber-700 dark:text-amber-400 border-none outline-none text-right"
                />
                <span className="text-amber-500 font-bold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={loanInputs.tenureYears}
              onInput={(e) => handleValueChange('tenureYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500"
            />
          </div>
        </>
      )}

      {mode === 'SWP' && (
        <>
          {/* Total Investment */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Total Investment</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.totalInvestment ? 'bg-red-50/10 border-red-200/30' : 'bg-indigo-50/10 border-indigo-200/50'
                } border focus-within:ring-4`}>
                <span className="text-indigo-500 font-bold mr-1">₹</span>
                <input
                  type="number"
                  value={displayValue(swpInputs.totalInvestment)}
                  onChange={(e) => handleValueChange('totalInvestment', e.target.value)}
                  className="w-24 bg-transparent text-lg font-bold text-indigo-700 dark:text-indigo-400 border-none outline-none text-right"
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
              className="w-full h-2 rounded-full cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Monthly Withdrawal</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.withdrawalAmount ? 'bg-red-50/10 border-red-200/30' : 'bg-rose-50/10 border-rose-200/50'
                } border focus-within:ring-4`}>
                <span className="text-rose-500 font-bold mr-1">₹</span>
                <input
                  type="number"
                  value={displayValue(swpInputs.withdrawalAmount)}
                  onChange={(e) => handleValueChange('withdrawalAmount', e.target.value)}
                  className="w-24 bg-transparent text-lg font-bold text-rose-700 dark:text-rose-400 border-none outline-none text-right"
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
              className="w-full h-2 rounded-full cursor-pointer accent-rose-500"
            />
          </div>

          {/* Expected Return */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Return Rate (p.a)</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.expectedReturn ? 'bg-red-50/10 border-red-200/30' : 'bg-emerald-50/10 border-emerald-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(swpInputs.expectedReturn)}
                  onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
                  className="w-14 bg-transparent text-lg font-bold text-emerald-700 dark:text-emerald-400 border-none outline-none text-right"
                />
                <span className="text-emerald-500 font-bold ml-1">%</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={swpInputs.expectedReturn}
              onInput={(e) => handleValueChange('expectedReturn', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Period */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Time Period</label>
              <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
                errors.periodYears ? 'bg-red-50/10 border-red-200/30' : 'bg-amber-50/10 border-amber-200/50'
                } border focus-within:ring-4`}>
                <input
                  type="number"
                  value={displayValue(swpInputs.periodYears)}
                  onChange={(e) => handleValueChange('periodYears', e.target.value)}
                  className="w-10 bg-transparent text-lg font-bold text-amber-700 dark:text-amber-400 border-none outline-none text-right"
                />
                <span className="text-amber-500 font-bold ml-1">Yr</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={swpInputs.periodYears}
              onInput={(e) => handleValueChange('periodYears', (e.target as HTMLInputElement).value)}
              className="w-full h-2 rounded-full cursor-pointer accent-amber-500"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InputSection;

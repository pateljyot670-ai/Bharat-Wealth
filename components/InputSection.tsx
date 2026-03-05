
import React, { useState, useEffect } from 'react';
import { SIPInputs, CalculationMode, Frequency } from '../types';
import { AlertCircle } from 'lucide-react';

interface Props {
  inputs: SIPInputs;
  setInputs: (inputs: SIPInputs) => void;
  onReset: () => void;
}

interface Errors {
  investmentAmount?: string;
  expectedReturn?: string;
  periodYears?: string;
}

const InputSection: React.FC<Props> = ({ inputs, setInputs, onReset }) => {
  const [errors, setErrors] = useState<Errors>({});

  const validate = (name: string, value: number) => {
    let error = '';
    if (name === 'investmentAmount') {
      const min = inputs.mode === 'SIP' ? 100 : 5000;
      const max = inputs.mode === 'SIP' ? 500000 : 10000000;
      if (value < min) error = `Minimum ₹${min.toLocaleString('en-IN')}`;
      if (value > max) error = `Maximum ₹${(max / 100000).toFixed(0)}L`;
      if (inputs.mode === 'Lumpsum' && value > 10000000) error = 'Maximum ₹1Cr';
    } else if (name === 'expectedReturn') {
      if (value < 1) error = 'Min 1%';
      if (value > 30) error = 'Max 30%';
    } else if (name === 'periodYears') {
      if (value < 1) error = 'Min 1 Yr';
      if (value > 50) error = 'Max 50 Yrs';
    }
    return error;
  };

  const handleValueChange = (name: keyof Omit<SIPInputs, 'mode' | 'frequency'>, valueStr: string) => {
    if (valueStr === '') {
      setInputs({ ...inputs, [name]: 0 });
      setErrors({ ...errors, [name]: validate(name, 0) });
      return;
    }
    const value = parseFloat(valueStr);
    const safeValue = isNaN(value) ? 0 : value;
    
    setInputs({ ...inputs, [name]: safeValue });
    setErrors({ ...errors, [name]: validate(name, safeValue) });
  };

  const handleModeChange = (mode: CalculationMode) => {
    const investmentAmount = mode === 'SIP' ? 5000 : 100000;
    setInputs({ ...inputs, mode, investmentAmount });
    setErrors({}); // Clear errors on mode change
  };

  const handleFrequencyChange = (frequency: Frequency) => {
    setInputs({ ...inputs, frequency });
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
        <div className="flex p-1 rounded-xl dark:bg-slate-800 bg-slate-200/50">
          <button
            onClick={() => handleModeChange('SIP')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
              inputs.mode === 'SIP' 
                ? 'dark:bg-slate-700 bg-white dark:text-indigo-400 text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            SIP
          </button>
          <button
            onClick={() => handleModeChange('Lumpsum')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
              inputs.mode === 'Lumpsum' 
                ? 'dark:bg-slate-700 bg-white dark:text-indigo-400 text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Lumpsum
          </button>
        </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200"></div>
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-500">
            Investment Details
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

      {inputs.mode === 'SIP' && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Frequency</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {frequencies.map((freq) => (
              <button
                key={freq}
                onClick={() => handleFrequencyChange(freq)}
                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all duration-200 ${
                  inputs.frequency === freq
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
            {inputs.mode === 'SIP' ? `${inputs.frequency} Amount` : 'One-time Amount'}
          </label>
          <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
            errors.investmentAmount 
              ? 'bg-red-50/10 dark:bg-red-900/5 border-red-200/30 dark:border-red-800/20 focus-within:ring-red-100/10' 
              : 'bg-indigo-50/10 dark:bg-indigo-900/5 border-indigo-200/50 dark:border-indigo-800/20 focus-within:ring-indigo-100/30 focus-within:bg-white dark:focus-within:bg-slate-900'
            } border focus-within:ring-4`}>
            <span className={`${errors.investmentAmount ? 'text-red-500' : 'text-indigo-500'} font-bold mr-1`}>₹</span>
            <input
              type="number"
              value={displayValue(inputs.investmentAmount)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleValueChange('investmentAmount', e.target.value)}
              placeholder="0"
              className={`w-24 bg-transparent text-lg font-bold ${errors.investmentAmount ? 'text-red-700' : 'text-indigo-700 dark:text-indigo-400'} border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>
        </div>
        {errors.investmentAmount && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 animate-fade-in">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold">{errors.investmentAmount}</span>
          </div>
        )}
        <input
          type="range"
          min={inputs.mode === 'SIP' ? 100 : 5000}
          max={inputs.mode === 'SIP' ? 500000 : 10000000}
          step={inputs.mode === 'SIP' ? 100 : 5000}
          value={inputs.investmentAmount}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('investmentAmount', (e.target as HTMLInputElement).value)}
          onChange={(e) => handleValueChange('investmentAmount', e.target.value)}
          className="w-full h-2 rounded-full cursor-pointer accent-indigo-600"
          style={{ color: '#6366f1' }}
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
          <span>₹{inputs.mode === 'SIP' ? '100' : '5k'}</span>
          <span>₹{inputs.mode === 'SIP' ? '5L' : '1Cr'}</span>
        </div>
      </div>

      {/* Expected Return */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Return Rate (p.a)</label>
          <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
            errors.expectedReturn 
              ? 'bg-red-50/10 dark:bg-red-900/5 border-red-200/30 dark:border-red-800/20 focus-within:ring-red-100/10' 
              : 'bg-emerald-50/10 dark:bg-emerald-900/5 border-emerald-200/50 dark:border-emerald-800/20 focus-within:ring-emerald-100/30 focus-within:bg-white dark:focus-within:bg-slate-900'
            } border focus-within:ring-4`}>
            <input
              type="number"
              value={displayValue(inputs.expectedReturn)}
              step="0.1"
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
              placeholder="0"
              className={`w-14 bg-transparent text-lg font-bold ${errors.expectedReturn ? 'text-red-700' : 'text-emerald-700 dark:text-emerald-400'} border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <span className={`${errors.expectedReturn ? 'text-red-500' : 'text-emerald-500'} font-bold ml-1`}>%</span>
          </div>
        </div>
        {errors.expectedReturn && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 animate-fade-in">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold">{errors.expectedReturn}</span>
          </div>
        )}
        <input
          type="range"
          min="1"
          max="30"
          step="0.1"
          value={inputs.expectedReturn}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('expectedReturn', (e.target as HTMLInputElement).value)}
          onChange={(e) => handleValueChange('expectedReturn', e.target.value)}
          className="w-full h-2 rounded-full cursor-pointer accent-emerald-500"
          style={{ color: '#10b981' }}
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
          <span>1%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Period */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold dark:text-slate-200 text-slate-800">Time Period</label>
          <div className={`flex items-center px-3 py-1 rounded-xl border transition-all duration-200 ${
            errors.periodYears 
              ? 'bg-red-50/10 dark:bg-red-900/5 border-red-200/30 dark:border-red-800/20 focus-within:ring-red-100/10' 
              : 'bg-amber-50/10 dark:bg-amber-900/5 border-amber-200/50 dark:border-amber-800/20 focus-within:ring-amber-100/30 focus-within:bg-white dark:focus-within:bg-slate-900'
            } border focus-within:ring-4`}>
            <input
              type="number"
              value={displayValue(inputs.periodYears)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleValueChange('periodYears', e.target.value)}
              placeholder="0"
              className={`w-10 bg-transparent text-lg font-bold ${errors.periodYears ? 'text-red-700' : 'text-amber-700 dark:text-amber-400'} border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <span className={`${errors.periodYears ? 'text-red-500' : 'text-amber-500'} font-bold ml-1`}>Yr</span>
          </div>
        </div>
        {errors.periodYears && (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 animate-fade-in">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold">{errors.periodYears}</span>
          </div>
        )}
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={inputs.periodYears}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('periodYears', (e.target as HTMLInputElement).value)}
          onChange={(e) => handleValueChange('periodYears', e.target.value)}
          className="w-full h-2 rounded-full cursor-pointer accent-amber-500"
          style={{ color: '#f59e0b' }}
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
          <span>1 Yr</span>
          <span>50 Yrs</span>
        </div>
      </div>
    </div>
  );
};

export default InputSection;

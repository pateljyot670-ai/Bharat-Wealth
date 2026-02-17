
import React from 'react';
import { SIPInputs, CalculationMode, Frequency } from '../types';

interface Props {
  inputs: SIPInputs;
  setInputs: (inputs: SIPInputs) => void;
  onReset: () => void;
}

const InputSection: React.FC<Props> = ({ inputs, setInputs, onReset }) => {
  const handleValueChange = (name: keyof Omit<SIPInputs, 'mode' | 'frequency'>, value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    setInputs({ ...inputs, [name]: safeValue });
  };

  const handleModeChange = (mode: CalculationMode) => {
    const investmentAmount = mode === 'SIP' ? 5000 : 100000;
    setInputs({ ...inputs, mode, investmentAmount });
  };

  const handleFrequencyChange = (frequency: Frequency) => {
    setInputs({ ...inputs, frequency });
  };

  /**
   * Prevents the slider from jumping to a value when the track is clicked.
   * Only allows interaction if the pointer hits the thumb.
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const rect = input.getBoundingClientRect();
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const value = parseFloat(input.value);
    
    // The thumb in our CSS is 24px wide.
    // Standard browser range inputs offset the track interaction 
    // to keep the thumb within the element boundaries.
    const thumbWidth = 24;
    const percent = (value - min) / (max - min);
    
    // Calculate the horizontal center of the thumb relative to the element
    const effectiveWidth = rect.width - thumbWidth;
    const thumbCenterX = (percent * effectiveWidth) + (thumbWidth / 2);
    
    // User's click/touch position relative to the element
    const clickX = e.clientX - rect.left;

    // Use a strict threshold (e.g., 18px radius) to ensure it only works on the thumb.
    // If the click is outside this range, we prevent the default 'jump' behavior.
    const threshold = 18; 
    if (Math.abs(clickX - thumbCenterX) > threshold) {
      e.preventDefault();
    }
  };

  const frequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

  return (
    <div className="space-y-6 p-6 rounded-2xl shadow-sm border transition-all duration-300 dark:bg-gray-800/30 dark:border-gray-700/50 bg-white border-gray-200/80 hover:shadow-lg">
      {/* Mode Switcher */}
      <div className="flex p-1 rounded-xl dark:bg-gray-800 bg-gray-100">
        <button
          onClick={() => handleModeChange('SIP')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            inputs.mode === 'SIP' 
              ? 'dark:bg-gray-700 bg-white dark:text-indigo-400 text-indigo-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          SIP
        </button>
        <button
          onClick={() => handleModeChange('Lumpsum')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            inputs.mode === 'Lumpsum' 
              ? 'dark:bg-gray-700 bg-white dark:text-indigo-400 text-indigo-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Lumpsum
        </button>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-400">
            Investment Details
          </h2>
        </div>
        <button 
          onClick={onReset}
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          Reset
        </button>
      </div>

      {inputs.mode === 'SIP' && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Investment Frequency</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {frequencies.map((freq) => (
              <button
                key={freq}
                onClick={() => handleFrequencyChange(freq)}
                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all duration-200 ${
                  inputs.frequency === freq
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/50'
                    : 'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 dark:border-gray-700 border-gray-200 hover:border-indigo-300 dark:hover:border-indigo-700'
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
          <label className="text-sm font-semibold dark:text-gray-300 text-gray-600">
            {inputs.mode === 'SIP' ? `${inputs.frequency} Investment` : 'One-time Investment'}
          </label>
          <div className="flex items-center px-3 py-1 rounded-xl border transition-all duration-200 dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:focus-within:ring-indigo-900/30 bg-indigo-50 border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="text-indigo-500 font-bold mr-1">₹</span>
            <input
              type="number"
              value={inputs.investmentAmount}
              onChange={(e) => handleValueChange('investmentAmount', Number(e.target.value))}
              className="w-24 bg-transparent text-lg font-bold dark:text-indigo-400 text-indigo-700 border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        <input
          type="range"
          min={inputs.mode === 'SIP' ? 100 : 5000}
          max={inputs.mode === 'SIP' ? 500000 : 10000000}
          step={inputs.mode === 'SIP' ? 100 : 5000}
          value={inputs.investmentAmount}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('investmentAmount', Number((e.target as HTMLInputElement).value))}
          onChange={(e) => handleValueChange('investmentAmount', Number(e.target.value))}
          style={{ 
            touchAction: 'none',
            color: '#6366f1'
          }}
          className="w-full h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
          <span>₹{inputs.mode === 'SIP' ? '100' : '5k'}</span>
          <span>₹{inputs.mode === 'SIP' ? '5L' : '1Cr'}</span>
        </div>
      </div>

      {/* Expected Return */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold dark:text-gray-300 text-gray-600">Expected Return Rate (p.a)</label>
          <div className="flex items-center px-3 py-1 rounded-xl border transition-all duration-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:focus-within:ring-emerald-900/30 bg-emerald-50 border-emerald-100 focus-within:ring-4 focus-within:ring-emerald-100">
            <input
              type="number"
              value={inputs.expectedReturn}
              step="0.1"
              onChange={(e) => handleValueChange('expectedReturn', Number(e.target.value))}
              className="w-14 bg-transparent text-lg font-bold dark:text-emerald-400 text-emerald-700 border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-emerald-500 font-bold ml-1">%</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="0.1"
          value={inputs.expectedReturn}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('expectedReturn', Number((e.target as HTMLInputElement).value))}
          onChange={(e) => handleValueChange('expectedReturn', Number(e.target.value))}
          style={{ 
            touchAction: 'none',
            color: '#10b981'
          }}
          className="w-full h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
          <span>1%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Period */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold dark:text-gray-300 text-gray-600">Time Period (Years)</label>
          <div className="flex items-center px-3 py-1 rounded-xl border transition-all duration-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:focus-within:ring-amber-900/30 bg-amber-50 border-amber-100 focus-within:ring-4 focus-within:ring-amber-100">
            <input
              type="number"
              value={inputs.periodYears}
              onChange={(e) => handleValueChange('periodYears', Number(e.target.value))}
              className="w-10 bg-transparent text-lg font-bold dark:text-amber-400 text-amber-700 border-none outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-amber-500 font-bold ml-1">Yr</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={inputs.periodYears}
          onPointerDown={handlePointerDown}
          onInput={(e) => handleValueChange('periodYears', Number((e.target as HTMLInputElement).value))}
          onChange={(e) => handleValueChange('periodYears', Number(e.target.value))}
          style={{ 
            touchAction: 'none',
            color: '#f59e0b'
          }}
          className="w-full h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
          <span>1 Year</span>
          <span>50 Years</span>
        </div>
      </div>
    </div>
  );
};

export default InputSection;

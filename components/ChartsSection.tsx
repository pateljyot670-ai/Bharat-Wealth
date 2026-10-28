import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { SIPResults, LoanResults, SWPResults, CalculationMode } from '../types';

interface Props {
  mode: CalculationMode;
  results: SIPResults | LoanResults | SWPResults;
}

const ChartsSection: React.FC<Props> = ({ mode, results }) => {
  const [showInvestedLine, setShowInvestedLine] = useState(true);
  const [showInflationLine, setShowInflationLine] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const getPieData = () => {
    if (mode === 'SIP' || mode === 'Lumpsum') {
      const res = results as SIPResults;
      return [
        { name: 'Invested Amount', value: res.totalInvested },
        { name: 'Estimated Returns', value: res.estimatedReturns },
      ];
    } else if (mode === 'Loan') {
      const res = results as LoanResults;
      return [
        { name: 'Principal Amount', value: res.totalPayment - res.totalInterest },
        { name: 'Total Interest', value: res.totalInterest },
      ];
    } else {
      const res = results as SWPResults;
      return [
        { name: 'Total Withdrawn', value: res.totalWithdrawn },
        { name: 'Final Balance', value: res.finalBalance },
      ];
    }
  };

  const pieData = getPieData();
  const COLORS = mode === 'Loan' ? ['#6366f1', '#f43f5e'] : ['#6366f1', '#10b981'];

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={fill}
          strokeWidth={1}
          style={{ filter: `drop-shadow(0px 4px 8px ${fill}55)` }}
        />
      </g>
    );
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 sm:p-4 rounded-xl shadow-xl border backdrop-blur-md transition-colors bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 min-w-[200px]">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Year {label} Forecast</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3 justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.stroke }}></div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{entry.name}:</span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  ₹{(entry.value ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const getChartData = () => {
    if (mode === 'SIP' || mode === 'Lumpsum') return (results as SIPResults).yearlyData;
    if (mode === 'Loan') return (results as LoanResults).amortizationData;
    return (results as SWPResults).yearlyData;
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6 min-w-0 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 w-full">
        {/* Composition Chart (Pie) */}
        <div className="p-4 sm:p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] border transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200/90 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-extrabold dark:text-white text-slate-900 flex items-center gap-2">
              <span className={`w-1.5 h-4 ${mode === 'Loan' ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full`}></span>
              {mode === 'Loan' ? 'Loan Breakdown' : mode === 'SWP' ? 'SWP Summary' : 'Wealth Composition'}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ratio Analysis</span>
          </div>
          <div className="h-64 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* @ts-ignore */}
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${(value ?? 0).toLocaleString('en-IN')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Projection Chart (Area) */}
        <div className="p-4 sm:p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_25px_-5px_rgba(0,0,0,0.04)] border transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200/90 min-w-0 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-extrabold dark:text-white text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              {mode === 'Loan' ? 'Repayment Schedule' : 'Growth Projection'}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {(mode === 'SIP' || mode === 'Lumpsum') && (
                <>
                  <button 
                    onClick={() => setShowInflationLine(!showInflationLine)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      showInflationLine 
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Toggle Inflation-adjusted line"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    {showInflationLine ? 'Real Value: ON' : 'Real Value: OFF'}
                  </button>

                  <button 
                    onClick={() => setShowInvestedLine(!showInvestedLine)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      showInvestedLine 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700' 
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    {showInvestedLine ? 'Principal: ON' : 'Principal: OFF'}
                  </button>
                </>
              )}

              {mode === 'SWP' && (
                <button 
                  onClick={() => setShowInflationLine(!showInflationLine)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    showInflationLine 
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-800' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  {showInflationLine ? 'Real Balance: ON' : 'Real Balance: OFF'}
                </button>
              )}
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={mode === 'Loan' ? '#f43f5e' : '#6366f1'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={mode === 'Loan' ? '#f43f5e' : '#6366f1'} stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => {
                    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                    return `₹${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Nominal Value */}
                <Area 
                  type="monotone" 
                  dataKey={mode === 'Loan' ? 'balance' : 'totalValue'} 
                  stroke={mode === 'Loan' ? '#f43f5e' : '#6366f1'} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  name={mode === 'Loan' ? 'Outstanding Balance' : 'Terminal Wealth (Nominal)'}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />

                {/* Real Value (Inflation-Adjusted) for SIP/Lumpsum */}
                {(mode === 'SIP' || mode === 'Lumpsum') && (
                  <Area 
                    type="monotone" 
                    dataKey="realValue" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#colorReal)" 
                    name="Real Purchasing Power"
                    hide={!showInflationLine}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                )}

                {/* SWP Real Balance */}
                {mode === 'SWP' && (
                  <Area 
                    type="monotone" 
                    dataKey="realBalance" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    fillOpacity={1}
                    fill="url(#colorReal)" 
                    name="Real Remaining Balance"
                    hide={!showInflationLine}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                )}

                {/* Invested Amount (SIP / Lumpsum) */}
                {(mode === 'SIP' || mode === 'Lumpsum') && (
                  <Area 
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    fillOpacity={0} 
                    name="Total Invested"
                    hide={!showInvestedLine}
                    activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
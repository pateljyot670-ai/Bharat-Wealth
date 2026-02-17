import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { SIPResults } from '../types';

interface Props {
  results: SIPResults;
}

const ChartsSection: React.FC<Props> = ({ results }) => {
  const [showInvestedLine, setShowInvestedLine] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const pieData = [
    { name: 'Invested Amount', value: results.totalInvested },
    { name: 'Estimated Returns', value: results.estimatedReturns },
  ];

  const COLORS = ['#6366f1', '#10b981'];

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
        <div className="p-4 rounded-xl shadow-xl border backdrop-blur-sm transition-colors dark:bg-gray-900/80 dark:border-gray-700 bg-gray-50/80 border-gray-200">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">Year {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 justify-between">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }}></div>
                <span className="text-xs font-medium dark:text-gray-400 text-gray-500">{entry.name}:</span>
              </span>
              <span className="text-sm font-bold dark:text-gray-100 text-gray-900">
                ₹{entry.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wealth Distribution (Pie) */}
        <div className="p-6 rounded-2xl shadow-sm border transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200/80">
          <h3 className="text-lg font-bold dark:text-gray-100 text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
            Wealth Composition
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* FIX: The `activeIndex` prop is valid for the Pie component, but the type definitions for recharts might be out of sync. Using @ts-ignore to suppress the error. */}
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
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Projection (Area) */}
        <div className="p-6 rounded-2xl shadow-sm border transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold dark:text-gray-100 text-gray-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
              Growth Projection
            </h3>
            
            <button 
              onClick={() => setShowInvestedLine(!showInvestedLine)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showInvestedLine 
                  ? 'dark:bg-gray-700 dark:text-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                  : 'dark:bg-indigo-900/30 dark:text-indigo-400 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                {showInvestedLine ? (
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26a4 4 0 015.493 5.493l-5.493-5.493z" clipRule="evenodd" />
                ) : (
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                )}
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3c2.11 0 4.041.665 5.624 1.797l-1.414 1.414A7.963 7.963 0 0010 5C6.333 5 3.393 7.42 2.146 10c.484 1.002 1.144 1.884 1.938 2.606L2.67 14.02A9.978 9.978 0 01.458 10z" clipRule="evenodd" />
              </svg>
              {showInvestedLine ? 'Hide Principal' : 'Show Principal'}
            </button>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
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
                <Area 
                  type="monotone" 
                  dataKey="totalValue" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  name="Total Wealth"
                  activeDot={{ r: 6, stroke: 'var(--card-bg, #fff)', strokeWidth: 2 }}
                  animationDuration={1500}
                  // FIX: `animationTimingFunction` is not a valid prop for Area. Use `animationEasing` instead.
                  animationEasing="ease-in-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="invested" 
                  stroke="#6b7280" 
                  strokeWidth={2} 
                  fillOpacity={0} 
                  name="Invested Amount"
                  hide={!showInvestedLine}
                  activeDot={{ r: 4, stroke: 'var(--card-bg, #fff)', strokeWidth: 2 }}
                  animationDuration={1000}
                  // FIX: `animationTimingFunction` is not a valid prop for Area. Use `animationEasing` instead.
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
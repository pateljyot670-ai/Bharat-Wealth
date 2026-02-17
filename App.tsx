import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SIPInputs, SIPResults, AIInsight } from './types';
import { calculateWealth, formatCurrency } from './utils/sipCalculations';
import { getFinancialInsights } from './services/geminiService';
import InputSection from './components/InputSection';
import ResultCards from './components/ResultCards';
import ChartsSection from './components/ChartsSection';
import OnboardingGuide from './components/OnboardingGuide';
import ShareModal from './components/ShareModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_INPUTS: SIPInputs = {
  investmentAmount: 5000,
  expectedReturn: 12,
  periodYears: 10,
  mode: 'SIP',
  frequency: 'Monthly'
};

const App: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [inputs, setInputs] = useState<SIPInputs>(DEFAULT_INPUTS);

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const results = useMemo(() => calculateWealth(inputs), [inputs]);

  const handleGetInsights = async () => {
    setIsGenerating(true);
    setAiInsight(null);
    setAiError(null);
    try {
      const insight = await getFinancialInsights(inputs, results);
      if (insight) {
        setAiInsight(insight);
      } else {
        setAiError("Unable to connect to AI advisor. Please try again.");
      }
    } catch (error) {
      setAiError("Unable to connect to AI advisor. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setAiInsight(null);
    setAiError(null);
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isCapturing) return;
    setIsCapturing(true);
    
    // Use a short timeout to allow the UI to update to the 'capturing' state
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reportRef.current!, {
          scale: 2, 
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
          onclone: (clonedDoc) => {
            const clonedContainer = clonedDoc.getElementById('professional-report-container');
            const clonedProHeader = clonedDoc.getElementById('report-header-professional');
            const isDark = document.documentElement.classList.contains('dark');

            // High contrast grid patterns
            const gridSvgLight = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
            const gridSvgDark = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23818cf8' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
            
            if (clonedContainer) {
              clonedContainer.style.padding = '48px';
              clonedContainer.style.borderRadius = '0px';
              clonedContainer.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc';
              clonedContainer.style.backgroundImage = isDark ? gridSvgDark : gridSvgLight;
              
              if (clonedProHeader) {
                clonedProHeader.style.display = 'flex';
                clonedProHeader.style.marginBottom = '40px';
              }

              const screenshotHides = clonedDoc.querySelectorAll('.screenshot-hide');
              screenshotHides.forEach(el => (el as HTMLElement).style.display = 'none');
            }
          }
        });
        
        const image = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let imgWidth = pdfWidth - 10; // slim margins for pro feel
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        
        pdf.addImage(image, 'PNG', x, y, imgWidth, imgHeight);
        
        const fileName = `BharatWealth_${inputs.mode}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } catch (err) {
        console.error("PDF report capture failed:", err);
      } finally {
        setIsCapturing(false);
      }
    }, 150);
  };

  const shareText = useMemo(() => {
    const { investmentAmount, frequency, periodYears, mode } = inputs;
    const { totalValue } = results;

    const amountStr = formatCurrency(investmentAmount);
    const totalValStr = formatCurrency(totalValue);
    const freqStr = mode === 'SIP' ? frequency.toLowerCase() : 'one-time';

    return `Just projected my wealth growth with Bharat Wealth! Investing ${amountStr} ${freqStr} for ${periodYears} years could grow to ${totalValStr}. Plan your financial future too! #BharatWealth #Investment #SIP #FinancialPlanning`;
  }, [inputs, results]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#020617] text-gray-100' : 'bg-gray-50 text-gray-900'} pb-24`}>
      {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} shareText={shareText} appUrl="https://bharatwealth.app" />}
      
      {/* Header */}
      <header className={`border-b transition-all duration-300 sticky top-0 z-40 ${darkMode ? 'bg-[#020617]/80 border-slate-800' : 'bg-white/80 border-gray-200'} backdrop-blur-xl screenshot-hide`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative w-10 h-10 transform transition-transform group-hover:rotate-12">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path 
                  d="M20 20 C20 20 50 10 80 20 L80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" 
                  fill="none" 
                  stroke="url(#logoGradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path 
                  d="M35 60 L50 75 L90 25 M90 25 L75 25 M90 25 L90 40" 
                  fill="none" 
                  stroke="url(#logoGradient)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-indigo-500 to-indigo-600">
              Bharat Wealth
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuide(true)}
              className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-500'} hover:scale-110 active:scale-95 border border-transparent dark:hover:border-slate-700`}
              aria-label="Show user guide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-gray-100 text-gray-500'} hover:scale-110 active:scale-95 border border-transparent dark:hover:border-slate-700`}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-8 screenshot-hide">
            <InputSection inputs={inputs} setInputs={setInputs} onReset={handleReset} />
            
            <div className="p-8 rounded-3xl shadow-2xl space-y-5 transition-transform hover:scale-[1.02] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white border border-white/10">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <span className="animate-pulse">✨</span> AI Strategist
              </h3>
              <p className="text-sm leading-relaxed text-indigo-100/90 font-medium">
                Get a high-conviction analysis from Gemini AI based on your {inputs.frequency.toLowerCase()} commitment of {formatCurrency(inputs.investmentAmount)}.
              </p>
              <button
                onClick={handleGetInsights}
                disabled={isGenerating}
                className="w-full py-4 px-6 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Generate Intelligence`
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Results & Analysis */}
          <div 
            className="lg:col-span-8 space-y-10 rounded-3xl" 
            ref={reportRef}
            id="professional-report-container"
          >
            {/* Professional Report Header (Visible only on captured PDF) */}
            <div id="report-header-professional" style={{ display: 'none' }} className="flex-col gap-8 pb-10 border-b-2 border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path d="M20 20 C20 20 50 10 80 20 L80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" fill="none" stroke="#ea580c" strokeWidth="8" />
                        <path d="M35 60 L50 75 L90 25" fill="none" stroke="#ea580c" strokeWidth="10" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Bharat Wealth</h1>
                  </div>
                  <h2 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">Investment Projection Report</h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Analysis Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50">
                    {inputs.mode} STRATEGY
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 bg-white/40 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mt-6 shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Committed Capital</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">₹{inputs.investmentAmount.toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-500">/{inputs.mode === 'SIP' ? inputs.frequency : 'Once'}</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Target Yield</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{inputs.expectedReturn}% <span className="text-xs font-bold text-slate-500">p.a.</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Growth Horizon</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{inputs.periodYears} <span className="text-xs font-bold text-slate-500">Years</span></p>
                </div>
              </div>
            </div>

            {/* Dashboard Controls (Visible only on web) */}
            <div className={`flex justify-between items-center mb-[-1rem] screenshot-hide`}>
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Growth Analytics</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`p-3 rounded-2xl transition-all flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-white text-gray-500 hover:text-indigo-600 shadow-sm border border-gray-200'} hover:scale-105 active:scale-95`}
                  title="Share Projection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isCapturing}
                  className={`p-3 rounded-2xl transition-all min-w-[140px] flex items-center justify-center ${darkMode ? 'bg-slate-800 text-indigo-400 hover:bg-indigo-700 hover:text-white border-transparent' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm border border-gray-200'} ${isCapturing ? 'opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95 font-bold'}`}
                >
                  {isCapturing ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[10px] uppercase tracking-widest">Generating</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-[10px] uppercase tracking-widest">Premium PDF</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <ResultCards results={results} />
            
            <ChartsSection results={results} />

            {/* AI Insights Display */}
            {(aiInsight || isGenerating || aiError) && (
              <div className={`p-10 rounded-3xl shadow-xl border transition-all duration-500 ${darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Strategy Intelligence</h3>
                </div>
                {isGenerating ? (
                  <div className="space-y-6">
                    <div className={`h-4 rounded-full w-3/4 animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
                    <div className={`h-4 rounded-full w-full animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
                    <div className="pt-4 grid grid-cols-2 gap-4">
                        <div className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}></div>
                        <div className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}></div>
                    </div>
                  </div>
                ) : aiError ? (
                  <div className="text-center py-6 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                    <p className="text-red-600 dark:text-red-400 font-bold">{aiError}</p>
                  </div>
                ) : aiInsight ? (
                  <div className="space-y-8">
                    <p className={`text-base leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{aiInsight.analysis}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl border bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/40 transform transition-all hover:scale-[1.03]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Tactical Advantage</h4>
                        </div>
                        <p className="text-sm font-bold text-emerald-900/80 dark:text-emerald-300/90 leading-relaxed">{aiInsight.proTip}</p>
                      </div>
                      
                      <div className="p-6 rounded-3xl border bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/40 transform transition-all hover:scale-[1.03]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">Risk Assessment</h4>
                        </div>
                        <p className="text-sm font-bold text-amber-900/80 dark:text-amber-300/90 leading-relaxed">{aiInsight.warning}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Verdict Card */}
            <div className={`p-10 rounded-[2.5rem] border shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border-slate-700 shadow-slate-900/20' : 'bg-white border-slate-200 shadow-slate-100'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className={`flex p-6 rounded-3xl transition-colors ${darkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className={`font-black mb-3 uppercase tracking-[0.25em] text-[10px] ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Strategic Wealth Verdict</h4>
                  <p className={`text-xl leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Deploying <span className="font-black text-indigo-500">₹{inputs.investmentAmount.toLocaleString('en-IN')}</span> {inputs.mode === 'SIP' ? inputs.frequency.toLowerCase() : 'lumpsum'} over <span className="font-black">{inputs.periodYears} years</span>, 
                    yields a high-impact terminal value of <span className="font-black text-3xl block md:inline text-indigo-600 dark:text-indigo-400">₹{results.totalValue.toLocaleString('en-IN')}</span>. 
                    Estimated capital appreciation totals <span className="font-black text-emerald-500">₹{results.estimatedReturns.toLocaleString('en-IN')}</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className={`pt-10 border-t-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center font-bold uppercase tracking-[0.2em] leading-relaxed italic max-w-2xl mx-auto">
                Regulatory Notice: Performance metrics are based on compound interest algorithms. Actual results depend on market volatility and underlying asset performance. Mutual funds are subject to market risks.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-16 text-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] pb-12 screenshot-hide">
        <div className="flex justify-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <p className="mb-2">Forged with precision in India</p>
        <p>© {new Date().getFullYear()} Bharat Wealth Strategic. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
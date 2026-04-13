
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SIPInputs, SIPResults, LoanInputs, LoanResults, SWPInputs, SWPResults, AIInsight, CalculationMode } from './types';
import { calculateWealth, formatCurrency } from './utils/sipCalculations';
import { calculateLoan } from './utils/loanCalculations';
import { calculateSWP } from './utils/swpCalculations';
import { getFinancialInsights } from './services/geminiService';
import InputSection from './components/InputSection';
import ResultCards from './components/ResultCards';
import ChartsSection from './components/ChartsSection';
import OnboardingGuide from './components/OnboardingGuide';
import ShareModal from './components/ShareModal';
import AIChatbot from './components/AIChatbot';
import { Share2, FileDown, Info, Sun, Moon, CheckCircle2, TrendingUp, RefreshCw, AlertCircle, MessageSquare, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_SIP_INPUTS: SIPInputs = {
  investmentAmount: 5000,
  expectedReturn: 12,
  periodYears: 10,
  mode: 'SIP',
  frequency: 'Monthly'
};

const DEFAULT_LOAN_INPUTS: LoanInputs = {
  loanAmount: 1000000,
  interestRate: 8.5,
  tenureYears: 20
};

const DEFAULT_SWP_INPUTS: SWPInputs = {
  totalInvestment: 1000000,
  withdrawalAmount: 10000,
  expectedReturn: 8,
  periodYears: 10
};

const App: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [mode, setMode] = useState<CalculationMode>('SIP');
  const [sipInputs, setSipInputs] = useState<SIPInputs>(DEFAULT_SIP_INPUTS);
  const [loanInputs, setLoanInputs] = useState<LoanInputs>(DEFAULT_LOAN_INPUTS);
  const [swpInputs, setSwpInputs] = useState<SWPInputs>(DEFAULT_SWP_INPUTS);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const results = useMemo(() => {
    if (mode === 'SIP' || mode === 'Lumpsum') {
      return calculateWealth(sipInputs);
    } else if (mode === 'Loan') {
      return calculateLoan(loanInputs);
    } else {
      return calculateSWP(swpInputs);
    }
  }, [mode, sipInputs, loanInputs, swpInputs]);

  const handleGetInsights = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      // For now, AI insights are only for SIP/Lumpsum as the service is tuned for that
      // We can expand it later
      if (mode === 'SIP' || mode === 'Lumpsum') {
        const insight = await getFinancialInsights(sipInputs, results as SIPResults);
        if (insight) {
          setAiInsight(insight);
        } else {
          setAiError("Could not generate insights. Please try again.");
        }
      } else {
        setAiError("AI Analysis is currently only available for Investment plans.");
      }
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || "AI Analysis failed. Please check your connection or try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (mode === 'SIP' || mode === 'Lumpsum') setSipInputs(DEFAULT_SIP_INPUTS);
    else if (mode === 'Loan') setLoanInputs(DEFAULT_LOAN_INPUTS);
    else setSwpInputs(DEFAULT_SWP_INPUTS);
    setAiInsight(null);
    setAiError(null);
  };

  const handleDownloadPdf = async () => {
    if (!pdfTemplateRef.current || isCapturing) return;
    setIsCapturing(true);
    
    await new Promise(r => setTimeout(r, 100));

    try {
      // html2canvas has issues with modern oklch colors used by Tailwind v4.
      // We override these to standard hex/rgb in index.css for the PDF template.
      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('pdf-report-hidden-template');
          if (el) {
            el.style.display = 'block';
            // Ensure no oklch colors leak in from computed styles if possible
            el.style.color = '#0f172a';
            el.style.backgroundColor = '#ffffff';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`BharatWealth_Report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const shareText = useMemo(() => {
    if (mode === 'SIP' || mode === 'Lumpsum') {
      const res = results as SIPResults;
      const amount = formatCurrency(sipInputs.investmentAmount);
      const total = formatCurrency(res.totalValue);
      const years = sipInputs.periodYears;
      const m = sipInputs.mode === 'SIP' ? `${sipInputs.frequency} SIP` : 'Lumpsum';
      return `I just projected my wealth growth with Bharat Wealth! 🚀\n\n💰 ${m}: ${amount}\n⏳ Period: ${years} Years\n📈 Estimated Value: ${total}\n\nPlan your financial future too!`;
    } else if (mode === 'Loan') {
      const res = results as LoanResults;
      return `I just calculated my Loan EMI with Bharat Wealth! 🏠\n\n💰 Loan: ${formatCurrency(loanInputs.loanAmount)}\n📉 EMI: ${formatCurrency(res.monthlyEMI)}\n⏳ Tenure: ${loanInputs.tenureYears} Years\n\nCalculate yours now!`;
    } else {
      const res = results as SWPResults;
      return `I just planned my retirement income with SWP on Bharat Wealth! 🏖️\n\n💰 Investment: ${formatCurrency(swpInputs.totalInvestment)}\n💵 Monthly Withdrawal: ${formatCurrency(swpInputs.withdrawalAmount)}\n📉 Final Balance: ${formatCurrency(res.finalBalance)}\n\nPlan your retirement too!`;
    }
  }, [mode, sipInputs, loanInputs, swpInputs, results]);

  const milestones = useMemo(() => {
    let data: any[] = [];
    if (mode === 'SIP' || mode === 'Lumpsum') data = (results as SIPResults).yearlyData;
    else if (mode === 'Loan') data = (results as LoanResults).amortizationData;
    else data = (results as SWPResults).yearlyData;

    if (data.length <= 5) return data;
    const step = Math.floor(data.length / 5);
    const filtered = data.filter((_, i) => i % step === 0 || i === data.length - 1);
    return Array.from(new Set(filtered.map(d => d.year))).map(y => data.find(d => d.year === y)!);
  }, [mode, results]);

  const whatsappLink = useMemo(() => {
    const phone = "7698428945";
    const message = encodeURIComponent(`Namaste! I'm interested in the ${mode} plan I just calculated on Bharat Wealth.\n\nDetails:\n${shareText}\n\nCan you provide more information?`);
    return `https://wa.me/${phone}?text=${message}`;
  }, [mode, shareText]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#020617] text-slate-100' : 'bg-white text-slate-900'} pb-24`}>
      {showGuide && <OnboardingGuide onClose={() => setShowGuide(false)} />}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} shareText={shareText} appUrl={window.location.origin} />}
      
      <AIChatbot 
        mode={mode}
        sipInputs={sipInputs}
        loanInputs={loanInputs}
        swpInputs={swpInputs}
        results={results}
        darkMode={darkMode}
        isOpen={showChat}
        setIsOpen={setShowChat}
      />

      {/* Floating WhatsApp Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 p-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#128C7E] transition-all transform hover:scale-110 z-50 flex items-center gap-2 group screenshot-hide"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap">
          WhatsApp Us
        </span>
      </a>
      
      {/* APP HEADER */}
      <header className={`border-b sticky top-0 z-40 ${darkMode ? 'bg-[#020617]/90 border-slate-800' : 'bg-white border-slate-200/60 shadow-sm'} backdrop-blur-xl screenshot-hide`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative w-10 h-10 transform transition-transform group-hover:rotate-12">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path d="M20 20 C20 20 50 10 80 20 L80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" fill="none" stroke="url(#logoGradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M35 60 L50 75 L90 25 M90 25 L75 25 M90 25 L90 40" fill="none" stroke="url(#logoGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-indigo-500 to-indigo-600">
              Bharat Wealth
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGuide(true)} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              title="How it works"
            >
              <Info className="h-5 w-5" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90">
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD UI */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-8 screenshot-hide">
          <InputSection 
            mode={mode}
            setMode={setMode}
            sipInputs={sipInputs}
            setSipInputs={setSipInputs}
            loanInputs={loanInputs}
            setLoanInputs={setLoanInputs}
            swpInputs={swpInputs}
            setSwpInputs={setSwpInputs}
            onReset={handleReset} 
          />
          
          {/* AI Strategy Advisor Box (Responsive Scheme) 🔵 */}
          <div className={`p-8 rounded-3xl space-y-4 shadow-xl border transition-all duration-300 ${darkMode ? 'bg-blue-900 border-blue-800 text-white' : 'bg-indigo-600 border-indigo-500 text-white'}`}>
             <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-indigo-200">⚡</span> AI Strategy Advisor
             </h3>
             <p className="text-sm font-medium text-indigo-50">Get a professional risk-reward analysis based on your current inputs.</p>
             <div className="pt-2">
               <button 
                 onClick={handleGetInsights} 
                 disabled={isGenerating}
                 className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                   darkMode ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                 }`}
               >
                  {isGenerating ? 'Analyzing...' : 'Analyze Plan'}
               </button>
             </div>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-8" ref={reportRef}>
           <div className="flex justify-between items-end screenshot-hide relative z-10">
              <div className="space-y-1">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Projection Dashboard</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Growth analysis & wealth forecast</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group flex items-center justify-center"
                  title="Share Plan"
                >
                  <Share2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300" strokeWidth={2.5} />
                </button>
                
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={isCapturing}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCapturing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="animate-spin h-5 w-5 text-white" strokeWidth={2.5} />
                      Processing
                    </span>
                  ) : (
                    <>
                      <FileDown className="h-5 w-5 text-white" strokeWidth={2.5} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
           </div>
           <ResultCards mode={mode} results={results} />
           <ChartsSection mode={mode} results={results} />
           
           {aiError && (
             <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-fade-in">
               <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
               <p className="text-sm font-medium text-red-800 dark:text-red-300">{aiError}</p>
             </div>
           )}
           
           {aiInsight && (
             <div className={`p-10 rounded-[2.5rem] border shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                  AI Strategic Insight
                </h3>
                <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400 mb-8">{aiInsight.analysis}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800">
                      <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-2">Pro Strategy</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-emerald-100">{aiInsight.proTip}</p>
                   </div>
                   <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800">
                      <h4 className="text-[10px] font-black uppercase text-amber-600 mb-2">Key Risk</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-amber-100">{aiInsight.warning}</p>
                   </div>
                </div>
             </div>
           )}
        </section>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 dark:border-slate-800 screenshot-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-6 h-6">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M20 20 C20 20 50 10 80 20 L80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tighter uppercase">Bharat Wealth</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 max-w-md">
              © {new Date().getFullYear()} Bharat Wealth. All rights reserved. 
              Developed with precision for the Indian investment landscape.
            </p>
          </div>
          <div className="bg-gray-100/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Professional Disclaimer</h4>
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              The projections and insights generated by Bharat Wealth are based on standardized mathematical growth formulas and are intended for illustrative and educational purposes only. 
              <span className="font-bold text-slate-700 dark:text-slate-300"> Mutual fund investments and securities market participations are subject to market risks; read all scheme related documents carefully before investing.</span> 
              Past performance is not a reliable indicator of future results. Bharat Wealth is a simulation tool and does not provide regulated financial, tax, or legal advice. 
              Users are strongly encouraged to consult with a SEBI-registered investment advisor before making any financial commitments.
            </p>
          </div>
        </div>
      </footer>

      {/* HIDDEN PREMIUM A4 REPORT TEMPLATE */}
      <div 
        ref={pdfTemplateRef}
        id="pdf-report-hidden-template"
        className="hidden" 
        style={{ 
          width: '800px', 
          backgroundColor: '#ffffff', 
          color: '#0f172a',
          padding: '60px',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div className="border-b-8 border-indigo-900 pb-12 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 -mr-20 -mt-20">
             <div className="w-96 h-96 border-[40px] border-indigo-900 rounded-full"></div>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="pdfLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                    <path d="M20 20 C20 20 50 10 80 20 L80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" fill="none" stroke="url(#pdfLogoGradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M35 60 L50 75 L90 25 M90 25 L75 25 M90 25 L90 40" fill="none" stroke="url(#pdfLogoGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                   <h2 className="text-3xl font-black tracking-tighter uppercase text-indigo-950">Bharat Wealth</h2>
                </div>
              </div>
              <h1 className="text-5xl font-extrabold text-slate-900">Portfolio Growth <br/><span className="text-indigo-600">Projections</span></h1>
            </div>
            <div className="text-right">
               <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document No.</p>
                  <p className="font-mono text-sm font-bold text-slate-800 uppercase">BW-{new Date().getFullYear()}-{Math.floor(Math.random()*10000)}</p>
               </div>
               <p className="text-sm font-medium text-slate-500">Issue Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
               <p className="text-xs text-indigo-500 font-black mt-2 uppercase tracking-widest">Confidential Report</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">I. Executive Summary</h3>
             <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {mode === 'SIP' || mode === 'Lumpsum' ? [
              { label: 'Investment Mode', value: `${sipInputs.mode} (${sipInputs.frequency})`, color: 'text-indigo-600' },
              { label: 'Principal Commitment', value: formatCurrency(sipInputs.investmentAmount), color: 'text-slate-900' },
              { label: 'Expected CAGR', value: `${sipInputs.expectedReturn}%`, color: 'text-emerald-600' },
              { label: 'Strategic Horizon', value: `${sipInputs.periodYears} Years`, color: 'text-amber-600' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              </div>
            )) : mode === 'Loan' ? [
              { label: 'Loan Amount', value: formatCurrency(loanInputs.loanAmount), color: 'text-indigo-600' },
              { label: 'Monthly EMI', value: formatCurrency((results as LoanResults).monthlyEMI), color: 'text-slate-900' },
              { label: 'Interest Rate', value: `${loanInputs.interestRate}%`, color: 'text-rose-600' },
              { label: 'Tenure', value: `${loanInputs.tenureYears} Years`, color: 'text-amber-600' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              </div>
            )) : [
              { label: 'Total Investment', value: formatCurrency(swpInputs.totalInvestment), color: 'text-indigo-600' },
              { label: 'Monthly Withdrawal', value: formatCurrency(swpInputs.withdrawalAmount), color: 'text-rose-900' },
              { label: 'Expected Return', value: `${swpInputs.expectedReturn}%`, color: 'text-emerald-600' },
              { label: 'Period', value: `${swpInputs.periodYears} Years`, color: 'text-amber-600' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12 grid grid-cols-12 gap-8 items-center">
           <div className="col-span-7">
             <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">II. Wealth Forecast</h3>
                <div className="flex-1 h-px bg-slate-100"></div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                   <p className="font-bold text-slate-600">
                     {mode === 'Loan' ? 'Total Principal' : mode === 'SWP' ? 'Total Investment' : 'Projected Total Invested'}
                   </p>
                   <p className="text-2xl font-black text-slate-900">
                     {formatCurrency(
                       mode === 'Loan' ? loanInputs.loanAmount : 
                       mode === 'SWP' ? swpInputs.totalInvestment : 
                       (results as SIPResults).totalInvested
                     )}
                   </p>
                </div>
                <div className="flex justify-between items-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <p className="font-bold text-slate-600">
                     {mode === 'Loan' ? 'Total Interest' : mode === 'SWP' ? 'Total Withdrawn' : 'Estimated Portfolio Yield'}
                   </p>
                   <p className="text-2xl font-black text-emerald-700">
                     {formatCurrency(
                       mode === 'Loan' ? (results as LoanResults).totalInterest : 
                       mode === 'SWP' ? (results as SWPResults).totalWithdrawn : 
                       (results as SIPResults).estimatedReturns
                     )}
                   </p>
                </div>
                <div className="flex justify-between items-center p-8 bg-indigo-900 rounded-[2rem] shadow-xl text-white">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                        {mode === 'Loan' ? 'Total Repayment' : mode === 'SWP' ? 'Final Balance' : 'Terminal Portfolio Value'}
                      </p>
                      <p className="text-3xl font-black">
                        {formatCurrency(
                          mode === 'Loan' ? (results as LoanResults).totalPayment : 
                          mode === 'SWP' ? (results as SWPResults).finalBalance : 
                          (results as SIPResults).totalValue
                        )}
                      </p>
                   </div>
                   <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <TrendingUp className="h-8 w-8" strokeWidth={3} />
                   </div>
                </div>
             </div>
           </div>
           
           <div className="col-span-5 bg-slate-50 p-8 rounded-3xl border border-slate-100 h-full flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Growth Milestones</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-200">
                    <th className="pb-3 font-bold uppercase text-[9px]">Year</th>
                    <th className="pb-3 font-bold uppercase text-[9px] text-right">
                      {mode === 'Loan' ? 'Principal Paid' : mode === 'SWP' ? 'Withdrawn' : 'Principal'}
                    </th>
                    <th className="pb-3 font-bold uppercase text-[9px] text-right">
                      {mode === 'Loan' ? 'Balance' : mode === 'SWP' ? 'Balance' : 'Total Wealth'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milestones.map((m, idx) => {
                    const val1 = mode === 'Loan' ? m.principalPaid : mode === 'SWP' ? m.withdrawn : m.invested;
                    const val2 = mode === 'Loan' ? m.remainingBalance : mode === 'SWP' ? m.balance : m.totalValue;
                    
                    return (
                      <tr key={idx} className="group">
                        <td className="py-3 font-black text-indigo-600">{m.year}</td>
                        <td className="py-3 text-right text-slate-500 font-medium">
                          ₹{(val1 ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          ₹{(val2 ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
           </div>
        </div>

        <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-end opacity-40">
           <div className="max-w-md">
              <p className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">
                Legal Disclaimer: This projection is generated using mathematical estimates. Past performance is not indicative of future returns. Bharat Wealth acts as a strategic simulation tool and does not provide regulated financial advice. Portfolio results are subject to market volatility.
              </p>
           </div>
           <div className="text-right flex flex-col items-end">
              <div className="mb-2">
                 <p className="text-[8px] font-black uppercase tracking-widest mb-1">Authenticated By</p>
                 <div className="w-24 h-8 bg-slate-100 rounded flex items-center justify-center border-2 border-slate-200 gap-1">
                    <CheckCircle2 className="h-3 w-3 text-slate-400" strokeWidth={3} />
                    <span className="text-[9px] font-black italic text-slate-400">VERIFIED</span>
                 </div>
                 
                 <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                   <p className="text-sm text-slate-500 dark:text-slate-400">Have more questions about this plan?</p>
                   <div className="flex flex-wrap gap-4">
                     <button 
                       onClick={() => setShowChat(true)}
                       className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                     >
                       <MessageSquare className="h-4 w-4" />
                       Ask AI Assistant
                     </button>
                     <a 
                       href={whatsappLink}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#128C7E] transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                     >
                       <MessageCircle className="h-4 w-4" />
                       WhatsApp for Info
                     </a>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;

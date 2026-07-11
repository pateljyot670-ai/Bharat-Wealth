
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
  const [pdfError, setPdfError] = useState<string | null>(null);
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
      const currentInputs = mode === 'SIP' || mode === 'Lumpsum' ? sipInputs : mode === 'Loan' ? loanInputs : swpInputs;
      const insight = await getFinancialInsights(currentInputs, results);
      if (insight) {
        setAiInsight(insight);
      } else {
        setAiError("Could not generate insights. Please try again.");
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
    setPdfError(null);
    
    await new Promise(r => setTimeout(r, 500)); // Give more time for rendering

    try {
      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
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
    } catch (err: any) {
      console.error("PDF Generation Error:", err);
      setPdfError("Failed to generate PDF. Please try again or use a different browser.");
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
    const message = encodeURIComponent(`Namaste! I'm interested in the ${mode} plan I just calculated on Bharat Wealth.\n\nDetails:\n${shareText}\n\nCan you provide more information?`);
    return `https://api.whatsapp.com/send?text=${message}`;
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
           
           {pdfError && (
             <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-fade-in mb-4">
               <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
               <p className="text-xs font-medium text-red-800 dark:text-red-300">{pdfError}</p>
             </div>
           )}

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
        <div className="mb-10 pb-8 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Have more questions about this plan?</p>
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
        className="" 
        style={{ 
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '800px', 
          backgroundColor: '#ffffff', 
          color: '#0f172a',
          padding: '60px',
          fontFamily: "'Inter', sans-serif",
          zIndex: -100
        }}
      >
        <div style={{ borderBottom: '8px solid #1e1b4b', paddingBottom: '3rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, marginRight: '-5rem', marginTop: '-5rem' }}>
             <div style={{ width: '24rem', height: '24rem', border: '40px solid #1e1b4b', borderRadius: '9999px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '4rem', height: '4rem', position: 'relative' }}>
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
                    <h2 style={{ fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#1e1b4b' }}>Bharat Wealth</h2>
                </div>
              </div>
              <h1 style={{ fontSize: '3rem', lineHeight: '1', fontWeight: 800, color: '#0f172a' }}>Portfolio Growth <br/><span style={{ color: '#4f46e5' }}>Projections</span></h1>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ backgroundColor: '#f1f5f9', paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Document No.</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase' }}>BW-{new Date().getFullYear()}-{Math.floor(Math.random()*10000)}</p>
               </div>
               <p style={{ fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500, color: '#64748b' }}>Issue Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
               <p style={{ fontSize: '0.75rem', lineHeight: '1rem', color: '#6366f1', fontWeight: 900, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidential Report</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
             <h3 style={{ fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#94a3b8' }}>I. Executive Summary</h3>
             <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#f1f5f9' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1.5rem' }}>
            {mode === 'SIP' || mode === 'Lumpsum' ? [
              { label: 'Investment Mode', value: `${sipInputs.mode} (${sipInputs.frequency})`, color: '#4f46e5' },
              { label: 'Principal Commitment', value: formatCurrency(sipInputs.investmentAmount), color: '#0f172a' },
              { label: 'Expected CAGR', value: `${sipInputs.expectedReturn}%`, color: '#059669' },
              { label: 'Strategic Horizon', value: `${sipInputs.periodYears} Years`, color: '#d97706' }
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 900, color: item.color }}>{item.value}</p>
              </div>
            )) : mode === 'Loan' ? [
              { label: 'Loan Amount', value: formatCurrency(loanInputs.loanAmount), color: '#4f46e5' },
              { label: 'Monthly EMI', value: formatCurrency((results as LoanResults).monthlyEMI), color: '#0f172a' },
              { label: 'Interest Rate', value: `${loanInputs.interestRate}%`, color: '#e11d48' },
              { label: 'Tenure', value: `${loanInputs.tenureYears} Years`, color: '#d97706' }
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 900, color: item.color }}>{item.value}</p>
              </div>
            )) : [
              { label: 'Total Investment', value: formatCurrency(swpInputs.totalInvestment), color: '#4f46e5' },
              { label: 'Monthly Withdrawal', value: formatCurrency(swpInputs.withdrawalAmount), color: '#4c0519' },
              { label: 'Expected Return', value: `${swpInputs.expectedReturn}%`, color: '#059669' },
              { label: 'Period', value: `${swpInputs.periodYears} Years`, color: '#d97706' }
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 900, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '2rem', alignItems: 'center' }}>
           <div style={{ gridColumn: 'span 7 / span 7' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#94a3b8' }}>II. Wealth Forecast</h3>
                <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#f1f5f9' }}></div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#eef2ff', borderRadius: '1rem', border: '1px solid #e0e7ff' }}>
                   <p style={{ fontWeight: 700, color: '#475569' }}>
                     {mode === 'Loan' ? 'Total Principal' : mode === 'SWP' ? 'Total Investment' : 'Projected Total Invested'}
                   </p>
                   <p style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 900, color: '#0f172a' }}>
                     {formatCurrency(
                       mode === 'Loan' ? loanInputs.loanAmount : 
                       mode === 'SWP' ? swpInputs.totalInvestment : 
                       (results as SIPResults).totalInvested
                     )}
                   </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#ecfdf5', borderRadius: '1rem', border: '1px solid #d1fae5' }}>
                   <p style={{ fontWeight: 700, color: '#475569' }}>
                     {mode === 'Loan' ? 'Total Interest' : mode === 'SWP' ? 'Total Withdrawn' : 'Estimated Portfolio Yield'}
                   </p>
                   <p style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 900, color: '#047857' }}>
                     {formatCurrency(
                       mode === 'Loan' ? (results as LoanResults).totalInterest : 
                       mode === 'SWP' ? (results as SWPResults).totalWithdrawn : 
                       (results as SIPResults).estimatedReturns
                     )}
                   </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', backgroundColor: '#1e1b4b', borderRadius: '2rem', color: '#ffffff' }}>
                   <div>
                      <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.25rem' }}>
                        {mode === 'Loan' ? 'Total Repayment' : mode === 'SWP' ? 'Final Balance' : 'Terminal Portfolio Value'}
                      </p>
                      <p style={{ fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: 900 }}>
                        {formatCurrency(
                          mode === 'Loan' ? (results as LoanResults).totalPayment : 
                          mode === 'SWP' ? (results as SWPResults).finalBalance : 
                          (results as SIPResults).totalValue
                        )}
                      </p>
                   </div>
                   <div style={{ width: '4rem', height: '4rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <TrendingUp className="h-8 w-8" strokeWidth={3} />
                   </div>
                </div>
             </div>
           </div>
           
           <div style={{ gridColumn: 'span 5 / span 5', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center' }}>Growth Milestones</h4>
              <table style={{ width: '100%', fontSize: '0.875rem', lineHeight: '1.25rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px' }}>Year</th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', textAlign: 'right' }}>
                      {mode === 'Loan' ? 'Principal Paid' : mode === 'SWP' ? 'Withdrawn' : 'Principal'}
                    </th>
                    <th style={{ paddingBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', textAlign: 'right' }}>
                      {mode === 'Loan' ? 'Balance' : mode === 'SWP' ? 'Balance' : 'Total Wealth'}
                    </th>
                  </tr>
                </thead>
                <tbody style={{ borderCollapse: 'collapse' }}>
                  {milestones.map((m, idx) => {
                    const val1 = mode === 'Loan' ? m.principalPaid : mode === 'SWP' ? m.withdrawn : m.invested;
                    const val2 = mode === 'Loan' ? m.remainingBalance : mode === 'SWP' ? m.balance : m.totalValue;
                    
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', fontWeight: 900, color: '#4f46e5' }}>{m.year}</td>
                        <td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                          ₹{(val1 ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{(val2 ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
           </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '3rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', opacity: 0.4 }}>
           <div style={{ maxWidth: '28rem' }}>
              <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: '1.625' }}>
                Legal Disclaimer: This projection is generated using mathematical estimates. Past performance is not indicative of future returns. Bharat Wealth acts as a strategic simulation tool and does not provide regulated financial advice. Portfolio results are subject to market volatility.
              </p>
           </div>
           <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                 <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', color: '#000000' }}>Authenticated By</p>
                 <div style={{ width: '6rem', height: '2rem', backgroundColor: '#f1f5f9', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justify: 'center', border: '2px solid #e2e8f0', gap: '0.25rem' }}>
                    <CheckCircle2 style={{ height: '0.75rem', width: '0.75rem', color: '#94a3b8' }} strokeWidth={3} />
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8' }}>VERIFIED</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;

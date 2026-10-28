import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SIPInputs, SIPResults, LoanInputs, LoanResults, SWPInputs, SWPResults, AIInsight, CalculationMode, TaxHoldingPeriod } from './types';
import { calculateWealth, formatCurrency, calculateCapitalGainsTax } from './utils/sipCalculations';
import { calculateLoan } from './utils/loanCalculations';
import { calculateSWP } from './utils/swpCalculations';
import { getFinancialInsights } from './services/geminiService';
import InputSection from './components/InputSection';
import ResultCards from './components/ResultCards';
import ChartsSection from './components/ChartsSection';
import OnboardingGuide from './components/OnboardingGuide';
import ShareModal from './components/ShareModal';
import AIChatbot from './components/AIChatbot';
import { Share2, FileDown, Info, Sun, Moon, CheckCircle2, TrendingUp, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_SIP_INPUTS: SIPInputs = {
  investmentAmount: 5000,
  expectedReturn: 12,
  periodYears: 10,
  mode: 'SIP',
  frequency: 'Monthly',
  inflationRate: 6
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
  periodYears: 10,
  inflationRate: 6
};

const WHATSAPP_LOGO_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

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
  const [showTaxImpact, setShowTaxImpact] = useState<boolean>(false);
  const [taxHoldingPeriod, setTaxHoldingPeriod] = useState<TaxHoldingPeriod>(() => {
    return DEFAULT_SIP_INPUTS.periodYears > 1 ? 'long-term' : 'short-term';
  });

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

  const taxImpactInfo = useMemo(() => {
    if (!showTaxImpact || (mode !== 'SIP' && mode !== 'Lumpsum' && mode !== 'SWP')) return null;
    let gains = 0;
    let invested = 0;
    if (mode === 'SIP' || mode === 'Lumpsum') {
      const res = results as SIPResults;
      gains = res.estimatedReturns;
      invested = res.totalInvested;
    } else if (mode === 'SWP') {
      const res = results as SWPResults;
      gains = Math.max(0, (res.totalWithdrawn + res.finalBalance) - swpInputs.totalInvestment);
      invested = swpInputs.totalInvestment;
    }
    return calculateCapitalGainsTax(gains, invested, taxHoldingPeriod);
  }, [showTaxImpact, mode, results, sipInputs, swpInputs, taxHoldingPeriod]);

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
    if (mode === 'SIP' || mode === 'Lumpsum') setSipInputs({ ...DEFAULT_SIP_INPUTS, mode });
    else if (mode === 'Loan') setLoanInputs(DEFAULT_LOAN_INPUTS);
    else setSwpInputs(DEFAULT_SWP_INPUTS);
    setAiInsight(null);
    setAiError(null);
  };

  const handleDownloadPdf = async () => {
    if (!pdfTemplateRef.current || isCapturing) return;
    setIsCapturing(true);
    setPdfError(null);
    
    await new Promise(r => setTimeout(r, 400));

    try {
      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = 210; // Standard A4 width in mm
      const calculatedHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = Math.max(297, Math.ceil(calculatedHeight));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pageHeight],
        compress: true 
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, calculatedHeight, undefined, 'FAST');
      pdf.save(`BharatWealth_${mode}_Report_${new Date().getTime()}.pdf`);
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
      const realVal = formatCurrency(res.realValue);
      const invested = formatCurrency(res.totalInvested);
      const returns = formatCurrency(res.estimatedReturns);
      const years = sipInputs.periodYears;
      const rate = sipInputs.expectedReturn;
      const inflation = sipInputs.inflationRate;
      const m = mode === 'SIP' ? `${sipInputs.frequency} SIP` : 'One-Time Lumpsum';
      
      return `🌟 *BHARAT WEALTH - ${mode.toUpperCase()} REPORT* 🌟
------------------------------------------
Namaste! I just calculated my wealth growth plan on Bharat Wealth! 🇮🇳

📊 *Plan Type*: ${m}
💰 *Principal Amount*: ${amount}
⏳ *Strategic Horizon*: ${years} Years
📈 *Expected CAGR*: ${rate}%${inflation > 0 ? `\n🎯 *Expected Inflation*: ${inflation}% p.a.` : ''}

🏆 *ESTIMATED FUTURE WEALTH* 🏆
✨ *Total Amount Invested*: ${invested}
✨ *Estimated Wealth Gained*: ${returns}
✨ *Terminal Portfolio Value*: ${total}${inflation > 0 ? `\n💎 *Real Purchasing Power (Today's ₹)*: ${realVal}` : ''}${showTaxImpact && taxImpactInfo ? `

⚖️ *TAX IMPACT (Union Budget 2024)* ⚖️
🏷️ *Holding Period*: ${taxHoldingPeriod === 'long-term' ? 'Long-Term (> 1 Yr, LTCG)' : 'Short-Term (≤ 1 Yr, STCG)'}
💸 *Estimated Tax Liability*: ${formatCurrency(taxImpactInfo.taxAmount)} (${taxImpactInfo.effectiveTaxRate}% effective)
💵 *Net In-Hand Wealth*: ${formatCurrency(taxImpactInfo.netTotalValue)}` : ''}

*Past performance is indicative, not guaranteed. Simulation by Bharat Wealth.*`;
    } else if (mode === 'Loan') {
      const res = results as LoanResults;
      const loanAmt = formatCurrency(loanInputs.loanAmount);
      const emi = formatCurrency(res.monthlyEMI);
      const totalInterest = formatCurrency(res.totalInterest);
      const totalPayment = formatCurrency(res.totalPayment);
      const years = loanInputs.tenureYears;
      const rate = loanInputs.interestRate;
      
      return `🌟 *BHARAT WEALTH - LOAN EMI REPORT* 🌟
------------------------------------------
Namaste! I just analyzed my loan repayment schedule on Bharat Wealth! 🇮🇳

📊 *Plan Type*: Loan EMI Calculation
💰 *Loan Principal Amount*: ${loanAmt}
⏳ *Tenure / Period*: ${years} Years
📈 *Annual Interest Rate*: ${rate}%

🏆 *REPAYMENT SUMMARY* 🏆
✨ *Monthly EMI Payable*: ${emi}
✨ *Total Interest Payable*: ${totalInterest}
✨ *Total Repayment Amount*: ${totalPayment}

*Always consult a registered financial advisor before taking credit.*`;
    } else {
      const res = results as SWPResults;
      const initialAmt = formatCurrency(swpInputs.totalInvestment);
      const withdrawAmt = formatCurrency(swpInputs.withdrawalAmount);
      const totalWithdrawn = formatCurrency(res.totalWithdrawn);
      const finalBal = formatCurrency(res.finalBalance);
      const realBal = formatCurrency(res.realFinalBalance);
      const years = swpInputs.periodYears;
      const rate = swpInputs.expectedReturn;
      const inflation = swpInputs.inflationRate;
      
      return `🌟 *BHARAT WEALTH - SWP RETIREMENT PLAN* 🌟
------------------------------------------
Namaste! I just formulated my systematic withdrawal retirement income plan! 🏖️🇮🇳

📊 *Plan Type*: SWP (Systematic Withdrawal)
💰 *Initial Lump Sum Investment*: ${initialAmt}
💵 *Target Monthly Income*: ${withdrawAmt}
⏳ *Retirement Horizon*: ${years} Years
📈 *Expected Annual Return*: ${rate}%${inflation > 0 ? `\n🎯 *Expected Inflation*: ${inflation}% p.a.` : ''}

🏆 *ESTIMATED MATURITY BENEFITS* 🏆
✨ *Total Amount Withdrawn*: ${totalWithdrawn}
✨ *Terminal Portfolio Balance*: ${finalBal}${inflation > 0 ? `\n💎 *Real Balance (Today's Purchasing Power)*: ${realBal}` : ''}${showTaxImpact && taxImpactInfo ? `

⚖️ *TAX IMPACT (Union Budget 2024)* ⚖️
🏷️ *Holding Period*: ${taxHoldingPeriod === 'long-term' ? 'Long-Term (> 1 Yr, LTCG)' : 'Short-Term (≤ 1 Yr, STCG)'}
💸 *Estimated Tax Liability*: ${formatCurrency(taxImpactInfo.taxAmount)} (${taxImpactInfo.effectiveTaxRate}% effective)
💵 *Net Post-Tax Wealth*: ${formatCurrency(taxImpactInfo.netTotalValue)}` : ''}

*Plan your second innings beautifully with Bharat Wealth.*`;
    }
  }, [mode, sipInputs, loanInputs, swpInputs, results, showTaxImpact, taxHoldingPeriod, taxImpactInfo]);

  const milestones = useMemo(() => {
    let data: any[] = [];
    if (mode === 'SIP' || mode === 'Lumpsum') data = (results as SIPResults).yearlyData;
    else if (mode === 'Loan') data = (results as LoanResults).amortizationData;
    else data = (results as SWPResults).yearlyData;

    if (data.length <= 8) return data;
    const step = Math.max(1, Math.floor(data.length / 7));
    const filtered = data.filter((_, i) => i === 0 || (i + 1) % step === 0 || i === data.length - 1);
    return Array.from(new Set(filtered.map(d => d.year))).map(y => data.find(d => d.year === y)!);
  }, [mode, results]);

  const handleWhatsAppShare = async (isSupportChat: boolean = false) => {
    const baseUrl = window.location.origin;
    const whatsappContactNumber = '919274268295';
    const textToShare = isSupportChat 
      ? `Namaste! I would like more information regarding Bharat Wealth and my ${mode} plan calculation.\n\n📊 Plan Details:\n${shareText}\n\nPlease share further information.`
      : `${shareText}\n\n👉 Plan your financial future: ${baseUrl}`;

    if (!isSupportChat && navigator.share) {
      try {
        await navigator.share({
          title: 'Bharat Wealth Growth Projections',
          text: textToShare,
          url: baseUrl
        });
        return;
      } catch (err) {
        console.log('Navigator share failed or cancelled, falling back to direct WhatsApp link.', err);
      }
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const encodedText = encodeURIComponent(textToShare);
    
    const whatsappUrl = isSupportChat
      ? (isMobile 
          ? `whatsapp://send?phone=${whatsappContactNumber}&text=${encodedText}` 
          : `https://wa.me/${whatsappContactNumber}?text=${encodedText}`)
      : (isMobile 
          ? `whatsapp://send?text=${encodedText}` 
          : `https://api.whatsapp.com/send?text=${encodedText}`);

    try {
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to launch WhatsApp URL scheme:', err);
      const fallbackUrl = isSupportChat
        ? `https://wa.me/${whatsappContactNumber}?text=${encodedText}`
        : `https://api.whatsapp.com/send?text=${encodedText}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Derived flags for PDF Report
  const activeInflationRate = mode === 'SIP' || mode === 'Lumpsum'
    ? sipInputs.inflationRate
    : mode === 'SWP'
      ? swpInputs.inflationRate
      : 0;
  const isInflationEnabled = mode !== 'Loan' && activeInflationRate > 0;
  const isTaxEnabled = mode !== 'Loan' && showTaxImpact && !!taxImpactInfo;
  const activeHorizonYears = mode === 'Loan'
    ? loanInputs.tenureYears
    : mode === 'SWP'
      ? swpInputs.periodYears
      : sipInputs.periodYears;

  const postTaxRealWealth = useMemo(() => {
    if (!isTaxEnabled || !isInflationEnabled || !taxImpactInfo) return null;
    return Math.round(taxImpactInfo.netTotalValue / Math.pow(1 + activeInflationRate / 100, activeHorizonYears));
  }, [isTaxEnabled, isInflationEnabled, taxImpactInfo, activeInflationRate, activeHorizonYears]);

  const pdfCategoryMeta = useMemo(() => {
    if (mode === 'SIP') {
      return {
        badge: 'CATEGORY I • SYSTEMATIC INVESTMENT PLAN (SIP)',
        accentColor: '#4f46e5',
        accentBg: '#eef2ff',
        accentBorder: '#c7d2fe',
        titleLine1: 'SIP Wealth Accumulation',
        titleLine2: 'Compounding Report',
        subtitle: `Periodic ${sipInputs.frequency} investment strategy over ${sipInputs.periodYears} years at ${sipInputs.expectedReturn}% p.a. expected CAGR.`
      };
    } else if (mode === 'Lumpsum') {
      return {
        badge: 'CATEGORY II • ONE-TIME LUMPSUM INVESTMENT',
        accentColor: '#0284c7',
        accentBg: '#f0f9ff',
        accentBorder: '#bae6fd',
        titleLine1: 'Lumpsum Capital Growth',
        titleLine2: 'Projection Report',
        subtitle: `Single-tranche capital deployment over ${sipInputs.periodYears} years compounding at ${sipInputs.expectedReturn}% p.a.`
      };
    } else if (mode === 'Loan') {
      return {
        badge: 'CATEGORY III • LOAN EMI & AMORTIZATION SCHEDULE',
        accentColor: '#e11d48',
        accentBg: '#fff1f2',
        accentBorder: '#fecdd3',
        titleLine1: 'Loan Repayment & EMI',
        titleLine2: 'Amortization Report',
        subtitle: `Structured debt service analysis for ${formatCurrency(loanInputs.loanAmount)} at ${loanInputs.interestRate}% p.a. over ${loanInputs.tenureYears} years.`
      };
    } else {
      return {
        badge: 'CATEGORY IV • SYSTEMATIC WITHDRAWAL PLAN (SWP)',
        accentColor: '#059669',
        accentBg: '#ecfdf5',
        accentBorder: '#a7f3d0',
        titleLine1: 'SWP Retirement Income',
        titleLine2: '& Cashflow Report',
        subtitle: `Monthly income drawdown of ${formatCurrency(swpInputs.withdrawalAmount)} from ${formatCurrency(swpInputs.totalInvestment)} corpus over ${swpInputs.periodYears} years.`
      };
    }
  }, [mode, sipInputs, loanInputs, swpInputs]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#020617] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} pb-24 w-full max-w-full overflow-x-hidden`}>
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

      {/* Floating WhatsApp Button (Logo Only - No Visible Phone Number) */}
      <button
        onClick={() => handleWhatsAppShare(true)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 p-3.5 sm:p-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#128C7E] transition-all transform hover:scale-105 active:scale-95 z-40 flex items-center justify-center screenshot-hide cursor-pointer border-none outline-none ring-2 ring-emerald-400/30"
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 fill-current shrink-0">
          <path d={WHATSAPP_LOGO_PATH} />
        </svg>
      </button>
      
      {/* APP HEADER */}
      <header className={`border-b sticky top-0 z-40 ${darkMode ? 'bg-[#020617]/90 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-xs'} backdrop-blur-xl screenshot-hide w-full`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 sm:gap-4 group cursor-pointer min-w-0" onClick={() => window.location.reload()}>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 transform transition-transform group-hover:rotate-12 shrink-0">
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
            <h1 className="text-lg sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-indigo-500 to-indigo-600 truncate">
              Bharat Wealth
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90 cursor-pointer"
              title={darkMode ? "Switch to White Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />}
            </button>
            <button 
              onClick={() => setShowGuide(true)} 
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-90 cursor-pointer"
              title="How it works"
              aria-label="How it works"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD UI */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 w-full overflow-hidden">
        <aside className="lg:col-span-4 space-y-6 sm:space-y-8 screenshot-hide min-w-0 w-full">
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
          
          {/* AI Strategy Advisor Box */}
          <div className={`p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border transition-all duration-300 ${darkMode ? 'bg-blue-900 border-blue-800 text-white' : 'bg-indigo-600 border-indigo-500 text-white'}`}>
             <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-indigo-200">⚡</span> AI Strategy Advisor
             </h3>
             <p className="text-sm font-medium text-indigo-50">Get a professional risk-reward analysis based on your current inputs.</p>
             <div className="pt-2">
               <button 
                 onClick={handleGetInsights} 
                 disabled={isGenerating}
                 className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg cursor-pointer ${
                   darkMode ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                 }`}
               >
                  {isGenerating ? 'Analyzing...' : 'Analyze Plan'}
               </button>
             </div>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0 w-full" ref={reportRef}>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3.5 screenshot-hide relative z-10 w-full">
              <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Projection Dashboard</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Growth analysis & wealth forecast</p>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group flex items-center justify-center shrink-0 cursor-pointer"
                  title="Share Plan"
                  aria-label="Share Plan"
                >
                  <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300" strokeWidth={2.5} />
                </button>
                
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={isCapturing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCapturing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2.5} />
                      Processing
                    </span>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2.5} />
                      <span>Download {mode} PDF</span>
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

           <ResultCards 
             mode={mode} 
             results={results} 
             periodYears={mode === 'Loan' ? loanInputs.tenureYears : mode === 'SWP' ? swpInputs.periodYears : sipInputs.periodYears}
             showTaxImpact={showTaxImpact}
             setShowTaxImpact={setShowTaxImpact}
             taxHoldingPeriod={taxHoldingPeriod}
             setTaxHoldingPeriod={setTaxHoldingPeriod}
           />
           <ChartsSection mode={mode} results={results} />
           
           {aiError && (
             <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-fade-in">
               <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
               <p className="text-sm font-medium text-red-800 dark:text-red-300">{aiError}</p>
             </div>
           )}
           
           {aiInsight && (
             <div className={`p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border shadow-xl min-w-0 w-full overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-6 sm:h-8 bg-indigo-600 rounded-full"></div>
                  AI Strategic Insight
                </h3>
                <p className="text-base sm:text-lg leading-relaxed text-slate-500 dark:text-slate-400 mb-6 sm:mb-8">{aiInsight.analysis}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                   <div className="p-4 sm:p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800">
                      <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-2">Pro Strategy</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-emerald-100">{aiInsight.proTip}</p>
                   </div>
                   <div className="p-4 sm:p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800">
                      <h4 className="text-[10px] font-black uppercase text-amber-600 mb-2">Key Risk</h4>
                      <p className="text-sm font-bold text-slate-800 dark:text-amber-100">{aiInsight.warning}</p>
                   </div>
                </div>
             </div>
           )}
        </section>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-gray-200 dark:border-slate-800 screenshot-hide w-full overflow-hidden">
        <div className="mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Have questions about your plan or need personalized info?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Connect with our AI Assistant or tap the WhatsApp icon for instant guidance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowChat(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 text-sm cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              Ask AI Assistant
            </button>
            <button 
              onClick={() => handleWhatsAppShare(true)}
              aria-label="WhatsApp"
              title="WhatsApp"
              className="w-11 h-11 flex items-center justify-center bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-all active:scale-95 shadow-lg shadow-emerald-600/20 cursor-pointer border-none outline-none shrink-0"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d={WHATSAPP_LOGO_PATH} />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
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
          <div className="bg-gray-100/50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-slate-800">
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

      {/* HIDDEN PREMIUM CATEGORY-SPECIFIC A4 REPORT TEMPLATE */}
      <div 
        ref={pdfTemplateRef}
        id="pdf-report-hidden-template"
        style={{ 
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '840px', 
          backgroundColor: '#ffffff', 
          color: '#0f172a',
          padding: '48px 52px',
          fontFamily: "'Inter', sans-serif",
          zIndex: -100,
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* REPORT HEADER BANNER */}
        <div style={{ borderBottom: `6px solid ${pdfCategoryMeta.accentColor}`, paddingBottom: '2rem', marginBottom: '2.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
            <div style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                <div style={{ width: '3.25rem', height: '3.25rem', position: 'relative' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
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
                  <h2 style={{ fontSize: '1.5rem', lineHeight: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#1e1b4b', margin: 0 }}>Bharat Wealth</h2>
                  <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>Institutional Financial Analytics</p>
                </div>
              </div>

              {/* Category Badge & Active Calculation Mode Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', backgroundColor: pdfCategoryMeta.accentBg, border: `1px solid ${pdfCategoryMeta.accentBorder}`, color: pdfCategoryMeta.accentColor, fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {pdfCategoryMeta.badge}
                </span>
                {isInflationEnabled && (
                  <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', fontSize: '10px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Inflation Adjusted ({activeInflationRate}% p.a.)
                  </span>
                )}
                {isTaxEnabled && taxImpactInfo && (
                  <span style={{ display: 'inline-block', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '10px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Tax Inclusive ({taxHoldingPeriod === 'long-term' ? 'LTCG 12.5%' : 'STCG 20%'})
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '2.35rem', lineHeight: '1.1', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                {pdfCategoryMeta.titleLine1} <br/>
                <span style={{ color: pdfCategoryMeta.accentColor }}>{pdfCategoryMeta.titleLine2}</span>
              </h1>
              <p style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 600, margin: 0, lineHeight: '1.4' }}>
                {pdfCategoryMeta.subtitle}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '0.75rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', margin: '0 0 0.25rem 0' }}>Report Reference</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>
                  BW-{mode.toUpperCase()}-{new Date().getFullYear()}
                </p>
              </div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', margin: '0 0 0.25rem 0' }}>
                Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
              <p style={{ fontSize: '0.7rem', color: pdfCategoryMeta.accentColor, fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isInflationEnabled && isTaxEnabled
                  ? 'Real Value + Post-Tax Edition'
                  : isTaxEnabled
                    ? 'Tax-Inclusive Edition'
                    : isInflationEnabled
                      ? 'Inflation-Adjusted Edition'
                      : 'Standard Nominal Edition'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION I: CATEGORY-SPECIFIC INPUT PARAMETERS */}
        <div style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#334155', margin: 0 }}>
              I. {mode === 'SIP' ? 'SIP Contribution Parameters' : mode === 'Lumpsum' ? 'Lumpsum Capital Parameters' : mode === 'Loan' ? 'Loan Facility Parameters' : 'SWP Drawdown Parameters'}
            </h3>
            <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>

          {/* Separate parameter grids for each of the 4 categories */}
          {mode === 'SIP' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.875rem' }}>
              {[
                { label: 'SIP Frequency', value: `${sipInputs.frequency} SIP`, sub: 'Systematic Plan', color: '#4f46e5' },
                { label: `${sipInputs.frequency} Amount`, value: formatCurrency(sipInputs.investmentAmount), sub: 'Periodic Installment', color: '#0f172a' },
                { label: 'Expected CAGR', value: `${sipInputs.expectedReturn}% p.a.`, sub: 'Compounded Return', color: '#059669' },
                { label: 'Tenure Horizon', value: `${sipInputs.periodYears} Years`, sub: 'Investment Duration', color: '#d97706' },
                { label: 'Inflation Rate', value: isInflationEnabled ? `${sipInputs.inflationRate}% p.a.` : '0% (Nominal)', sub: isTaxEnabled ? `Tax: ${taxHoldingPeriod === 'long-term' ? 'LTCG 12.5%' : 'STCG 20%'}` : 'Purchasing Power', color: '#0d9488' }
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 0.35rem 0' }}>{item.label}</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 900, color: item.color, margin: '0 0 0.2rem 0' }}>{item.value}</p>
                  <p style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          )}

          {mode === 'Lumpsum' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.875rem' }}>
              {[
                { label: 'Investment Type', value: 'One-Time Lumpsum', sub: 'Single Tranche', color: '#0284c7' },
                { label: 'Initial Principal', value: formatCurrency(sipInputs.investmentAmount), sub: 'Upfront Capital', color: '#0f172a' },
                { label: 'Expected CAGR', value: `${sipInputs.expectedReturn}% p.a.`, sub: 'Annualized Growth', color: '#059669' },
                { label: 'Holding Period', value: `${sipInputs.periodYears} Years`, sub: 'Compounding Tenure', color: '#d97706' },
                { label: 'Inflation Rate', value: isInflationEnabled ? `${sipInputs.inflationRate}% p.a.` : '0% (Nominal)', sub: isTaxEnabled ? `Tax: ${taxHoldingPeriod === 'long-term' ? 'LTCG 12.5%' : 'STCG 20%'}` : 'Real Value Basis', color: '#0d9488' }
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 0.35rem 0' }}>{item.label}</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 900, color: item.color, margin: '0 0 0.2rem 0' }}>{item.value}</p>
                  <p style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          )}

          {mode === 'Loan' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.875rem' }}>
              {[
                { label: 'Sanctioned Principal', value: formatCurrency(loanInputs.loanAmount), sub: 'Total Amount Borrowed', color: '#4f46e5' },
                { label: 'Interest Rate', value: `${loanInputs.interestRate}% p.a.`, sub: 'Reducing Balance Rate', color: '#e11d48' },
                { label: 'Repayment Tenure', value: `${loanInputs.tenureYears} Years`, sub: `${loanInputs.tenureYears * 12} Monthly EMIs`, color: '#d97706' },
                { label: 'Interest Burden Ratio', value: `${(((results as LoanResults).totalInterest / Math.max(1, loanInputs.loanAmount)) * 100).toFixed(1)}%`, sub: 'Interest vs Principal', color: '#0f172a' }
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 0.35rem 0' }}>{item.label}</p>
                  <p style={{ fontSize: '1.15rem', fontWeight: 900, color: item.color, margin: '0 0 0.2rem 0' }}>{item.value}</p>
                  <p style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          )}

          {mode === 'SWP' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.875rem' }}>
              {[
                { label: 'Initial Corpus', value: formatCurrency(swpInputs.totalInvestment), sub: 'Starting Capital Pool', color: '#4f46e5' },
                { label: 'Monthly Payout', value: formatCurrency(swpInputs.withdrawalAmount), sub: `${formatCurrency(swpInputs.withdrawalAmount * 12)} / Year`, color: '#e11d48' },
                { label: 'Portfolio Return', value: `${swpInputs.expectedReturn}% p.a.`, sub: 'On Remaining Corpus', color: '#059669' },
                { label: 'Drawdown Tenure', value: `${swpInputs.periodYears} Years`, sub: `${swpInputs.periodYears * 12} Monthly Withdrawals`, color: '#d97706' },
                { label: 'Inflation Rate', value: isInflationEnabled ? `${swpInputs.inflationRate}% p.a.` : '0% (Nominal)', sub: isTaxEnabled ? `Tax: ${taxHoldingPeriod === 'long-term' ? 'LTCG 12.5%' : 'STCG 20%'}` : 'Real Balance Basis', color: '#0d9488' }
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 0.35rem 0' }}>{item.label}</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 900, color: item.color, margin: '0 0 0.2rem 0' }}>{item.value}</p>
                  <p style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION II: CATEGORY-SPECIFIC PRIMARY OUTCOME SUMMARY */}
        <div style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#334155', margin: 0 }}>
              II. {mode === 'SIP' ? 'SIP Wealth Accumulation Summary' : mode === 'Lumpsum' ? 'Lumpsum Compounding Summary' : mode === 'Loan' ? 'Loan EMI & Repayment Breakdown' : 'SWP Cashflow & Residual Corpus Summary'}
            </h3>
            <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>

          {(mode === 'SIP' || mode === 'Lumpsum') && (() => {
            const res = results as SIPResults;
            const wealthMultiplier = (res.totalValue / Math.max(1, res.totalInvested)).toFixed(2);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b45309', margin: '0 0 0.35rem 0' }}>
                    {mode === 'SIP' ? 'Total Capital Invested' : 'One-Time Principal Deployed'}
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#d97706', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.totalInvested)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', margin: 0 }}>
                    {mode === 'SIP' ? `Cumulative ${sipInputs.frequency} contributions` : '100% upfront capital commitment'}
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#047857', margin: '0 0 0.35rem 0' }}>
                    Estimated Wealth Gain (Pre-Tax)
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', margin: '0 0 0.25rem 0' }}>
                    +{formatCurrency(res.estimatedReturns)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#065f46', margin: 0 }}>
                    Wealth Multiplier: {wealthMultiplier}x of principal
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#1e1b4b', border: '1px solid #312e81', color: '#ffffff' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', margin: '0 0 0.35rem 0' }}>
                    Terminal Portfolio Value (Nominal)
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.totalValue)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#c7d2fe', margin: 0 }}>
                     Projected maturity corpus after {sipInputs.periodYears} yrs
                  </p>
                </div>
              </div>
            );
          })()}

          {mode === 'Loan' && (() => {
            const res = results as LoanResults;
            const principalPct = ((loanInputs.loanAmount / Math.max(1, res.totalPayment)) * 100).toFixed(1);
            const interestPct = ((res.totalInterest / Math.max(1, res.totalPayment)) * 100).toFixed(1);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4338ca', margin: '0 0 0.35rem 0' }}>
                    Monthly EMI Commitment
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#4f46e5', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.monthlyEMI)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#3730a3', margin: 0 }}>
                    Annual Outflow: {formatCurrency(res.monthlyEMI * 12)} / yr
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#be123c', margin: '0 0 0.35rem 0' }}>
                    Total Interest Payable
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#e11d48', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.totalInterest)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#9f1239', margin: 0 }}>
                    {interestPct}% of total loan repayment
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#1e1b4b', border: '1px solid #312e81', color: '#ffffff' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', margin: '0 0 0.35rem 0' }}>
                    Total Repayment Outflow
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.totalPayment)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#c7d2fe', margin: 0 }}>
                    Principal ({principalPct}%) + Interest ({interestPct}%)
                  </p>
                </div>
              </div>
            );
          })()}

          {mode === 'SWP' && (() => {
            const res = results as SWPResults;
            const totalGenerated = Math.max(0, (res.totalWithdrawn + res.finalBalance) - swpInputs.totalInvestment);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#047857', margin: '0 0 0.35rem 0' }}>
                    Total Income Withdrawn
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.totalWithdrawn)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#065f46', margin: 0 }}>
                    {formatCurrency(swpInputs.withdrawalAmount)}/mo over {swpInputs.periodYears} yrs
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4338ca', margin: '0 0 0.35rem 0' }}>
                    Net Portfolio Yield Generated
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#4f46e5', margin: '0 0 0.25rem 0' }}>
                    +{formatCurrency(totalGenerated)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#3730a3', margin: 0 }}>
                    Total Withdrawn + Final Balance - Corpus
                  </p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: '#1e1b4b', border: '1px solid #312e81', color: '#ffffff' }}>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', margin: '0 0 0.35rem 0' }}>
                    Final Corpus Balance (Nominal)
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                    {formatCurrency(res.finalBalance)}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#c7d2fe', margin: 0 }}>
                    {res.finalBalance > 0 ? 'Residual capital preserved at maturity' : 'Corpus fully utilized during tenure'}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* SECTION III: CONDITIONAL INFLATION & TAX INCLUSIVE ANALYSIS (WHEN CHOSEN BY USER) */}
        {(isInflationEnabled || isTaxEnabled) && (
          <div style={{ marginBottom: '2.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#0f766e', margin: 0 }}>
                III. {isInflationEnabled && isTaxEnabled
                  ? 'Inflation-Adjusted & Tax-Inclusive Impact Analysis'
                  : isInflationEnabled
                    ? 'Inflation Purchasing Power Analysis'
                    : 'Capital Gains Tax Impact Analysis (Union Budget 2024)'}
              </h3>
              <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#ccfbf1' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isInflationEnabled && isTaxEnabled ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))', gap: '1.25rem' }}>
              {/* INFLATION CARD (Shown if user chose inflationRate > 0) */}
              {isInflationEnabled && (() => {
                const nominalVal = mode === 'SWP' ? (results as SWPResults).finalBalance : (results as SIPResults).totalValue;
                const realVal = mode === 'SWP' ? (results as SWPResults).realFinalBalance : (results as SIPResults).realValue;
                const erosion = Math.max(0, nominalVal - realVal);
                return (
                  <div style={{ padding: '1.35rem', borderRadius: '1rem', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', paddingBottom: '0.65rem', borderBottom: '1px solid #ccfbf1' }}>
                      <div>
                        <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f766e', margin: 0 }}>
                          Inflation Adjustment ({activeInflationRate}% p.a.)
                        </p>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#115e59', margin: '0.15rem 0 0 0' }}>
                          Purchasing power over {activeHorizonYears} years
                        </p>
                      </div>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: '#ccfbf1', color: '#0f766e', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>
                        Today's ₹ Value
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                      <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #ccfbf1' }}>
                        <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.25rem 0' }}>Nominal Value</p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{formatCurrency(nominalVal)}</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #ccfbf1' }}>
                        <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.25rem 0' }}>Inflation Erosion</p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#e11d48', margin: 0 }}>-{formatCurrency(erosion)}</p>
                      </div>
                      <div style={{ backgroundColor: '#0f766e', padding: '0.75rem', borderRadius: '0.65rem', color: '#ffffff' }}>
                        <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#99f6e4', margin: '0 0 0.25rem 0' }}>Real Value (Today's ₹)</p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>{formatCurrency(realVal)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAX INCLUSIVE CARD (Shown if user enabled Tax Impact toggle) */}
              {isTaxEnabled && taxImpactInfo && (
                <div style={{ padding: '1.35rem', borderRadius: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', paddingBottom: '0.65rem', borderBottom: '1px solid #fee2e2' }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b91c1c', margin: 0 }}>
                        Tax Inclusive Calculation ({taxHoldingPeriod === 'long-term' ? 'LTCG > 1 Yr @ 12.5%' : 'STCG ≤ 1 Yr @ 20%'})
                      </p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#7f1d1d', margin: '0.15rem 0 0 0' }}>
                        {taxHoldingPeriod === 'long-term' ? 'Sec 112A: ₹1.25L annual exemption applied' : 'Sec 111A: Flat 20% on short-term gains'}
                      </p>
                    </div>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>
                      Eff. Rate: {taxImpactInfo.effectiveTaxRate}%
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #fee2e2' }}>
                      <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.25rem 0' }}>Taxable Gains</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{formatCurrency(taxImpactInfo.taxableGains)}</p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #fee2e2' }}>
                      <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.25rem 0' }}>Est. Tax Liability</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>-{formatCurrency(taxImpactInfo.taxAmount)}</p>
                    </div>
                    <div style={{ backgroundColor: '#991b1b', padding: '0.75rem', borderRadius: '0.65rem', color: '#ffffff' }}>
                      <p style={{ fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', color: '#fecaca', margin: '0 0 0.25rem 0' }}>Net In-Hand Wealth</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>{formatCurrency(taxImpactInfo.netTotalValue)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COMBINED BANNER WHEN BOTH INFLATION AND TAX ARE CHOSEN */}
            {isInflationEnabled && isTaxEnabled && taxImpactInfo && postTaxRealWealth !== null && (
              <div style={{ marginTop: '1rem', padding: '1rem 1.35rem', borderRadius: '0.875rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#334155', margin: '0 0 0.2rem 0' }}>
                    Net Real Post-Tax Purchasing Power (Inflation + Tax Adjusted)
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, margin: 0 }}>
                    Net in-hand corpus of {formatCurrency(taxImpactInfo.netTotalValue)} after {formatCurrency(taxImpactInfo.taxAmount)} tax, discounted for {activeInflationRate}% p.a. inflation over {activeHorizonYears} years.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#0f766e', margin: '0 0 0.15rem 0' }}>True Purchasing Power</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f766e', margin: 0 }}>{formatCurrency(postTaxRealWealth)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION IV: CATEGORY-SPECIFIC YEAR-BY-YEAR SCHEDULE TABLE */}
        <div style={{ marginBottom: aiInsight ? '2rem' : '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#334155', margin: 0 }}>
              {isInflationEnabled || isTaxEnabled ? 'IV.' : 'III.'} {mode === 'Loan' ? 'Loan Amortization Milestone Schedule' : mode === 'SWP' ? 'SWP Annual Cashflow & Balance Schedule' : `${mode} Annual Wealth Progression Schedule`}
            </h3>
            <div style={{ flex: '1 1 0%', height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem 1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', letterSpacing: '0.06em' }}>Year</th>
                  {mode === 'SIP' || mode === 'Lumpsum' ? (
                    <>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        {mode === 'SIP' ? 'Cumulative Invested' : 'Principal Invested'}
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Est. Gain
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Nominal Wealth
                      </th>
                      {isInflationEnabled && (
                        <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', color: '#0f766e', letterSpacing: '0.06em' }}>
                          Real Value ({activeInflationRate}% Infl.)
                        </th>
                      )}
                      {isTaxEnabled && (
                        <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', color: '#b91c1c', letterSpacing: '0.06em' }}>
                          Post-Tax Wealth
                        </th>
                      )}
                    </>
                  ) : mode === 'Loan' ? (
                    <>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Cumulative Principal Paid
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Cumulative Interest Paid
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Outstanding Balance
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', color: '#4f46e5', letterSpacing: '0.06em' }}>
                        Repaid %
                      </th>
                    </>
                  ) : (
                    <>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Initial Corpus
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Cumulative Withdrawn
                      </th>
                      <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', letterSpacing: '0.06em' }}>
                        Nominal Balance
                      </th>
                      {isInflationEnabled && (
                        <th style={{ paddingBottom: '0.65rem', fontWeight: 900, textTransform: 'uppercase', fontSize: '9.5px', textAlign: 'right', color: '#0f766e', letterSpacing: '0.06em' }}>
                          Real Balance (Today's ₹)
                        </th>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, idx) => {
                  if (mode === 'SIP' || mode === 'Lumpsum') {
                    const gain = Math.max(0, (m.totalValue ?? 0) - (m.invested ?? 0));
                    const yrTax = isTaxEnabled
                      ? calculateCapitalGainsTax(gain, m.invested ?? 0, taxHoldingPeriod)
                      : null;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: 900, color: pdfCategoryMeta.accentColor }}>Year {m.year}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                          {formatCurrency(m.invested ?? 0)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                          +{formatCurrency(gain)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(m.totalValue ?? 0)}
                        </td>
                        {isInflationEnabled && (
                          <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f766e' }}>
                            {formatCurrency(m.realValue ?? 0)}
                          </td>
                        )}
                        {isTaxEnabled && yrTax && (
                          <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>
                            {formatCurrency(yrTax.netTotalValue)}
                          </td>
                        )}
                      </tr>
                    );
                  } else if (mode === 'Loan') {
                    const repaidPct = (((m.principalPaid ?? 0) / Math.max(1, loanInputs.loanAmount)) * 100).toFixed(1);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: 900, color: pdfCategoryMeta.accentColor }}>Year {m.year}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                          {formatCurrency(m.principalPaid ?? 0)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#e11d48', fontWeight: 700 }}>
                          {formatCurrency(m.interestPaid ?? 0)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(m.remainingBalance ?? 0)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>
                          {repaidPct}%
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: 900, color: pdfCategoryMeta.accentColor }}>Year {m.year}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                          {formatCurrency(swpInputs.totalInvestment)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                          {formatCurrency(m.withdrawn ?? 0)}
                        </td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(m.balance ?? 0)}
                        </td>
                        {isInflationEnabled && (
                          <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f766e' }}>
                            {formatCurrency(m.realBalance ?? 0)}
                          </td>
                        )}
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* OPTIONAL AI STRATEGIC INSIGHT IN PDF IF GENERATED */}
        {aiInsight && (
          <div style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem', borderRadius: '1rem', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#4338ca', margin: '0 0 0.5rem 0' }}>
              AI Strategic Advisory Note
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#1e293b', fontWeight: 500, margin: '0 0 0.75rem 0' }}>
              {aiInsight.analysis}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.65rem', backgroundColor: '#ffffff', border: '1px solid #a7f3d0' }}>
                <p style={{ fontSize: '8.5px', fontWeight: 900, textTransform: 'uppercase', color: '#059669', margin: '0 0 0.2rem 0' }}>Pro Strategy</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{aiInsight.proTip}</p>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.65rem', backgroundColor: '#ffffff', border: '1px solid #fde68a' }}>
                <p style={{ fontSize: '8.5px', fontWeight: 900, textTransform: 'uppercase', color: '#d97706', margin: '0 0 0.2rem 0' }}>Key Risk Factor</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{aiInsight.warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* REPORT FOOTER */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '520px' }}>
            <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: '1.6', color: '#64748b', margin: 0 }}>
              Regulatory & Tax Disclaimer: This {mode} report is generated using standardized financial formulas. {isTaxEnabled ? 'Capital gains tax projections are indicative estimates based on Indian Union Budget 2024 equity taxation rules (Sec 112A / 111A) excluding surcharge/cess. ' : ''}Past performance does not guarantee future returns. Consult a SEBI-registered investment advisor or Chartered Accountant before making financial decisions.
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.25rem 0', color: '#475569' }}>Authenticated Report</p>
            <div style={{ padding: '0.35rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.375rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', gap: '0.35rem' }}>
              <CheckCircle2 style={{ height: '0.75rem', width: '0.75rem', color: '#059669' }} strokeWidth={3} />
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.08em' }}>BHARAT WEALTH VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

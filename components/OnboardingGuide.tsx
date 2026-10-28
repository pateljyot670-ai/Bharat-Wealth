
import React, { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const OnboardingGuide: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] p-6 sm:p-8 space-y-6 overflow-y-auto rounded-3xl shadow-2xl animate-slide-up border dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black dark:text-white text-slate-900">Welcome to Bharat Wealth!</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors dark:hover:bg-slate-800 hover:bg-slate-100 cursor-pointer"
            aria-label="Close guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 dark:text-slate-400 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="text-sm font-medium">This calculator is designed to help you project your wealth creation and understand true purchasing power. Here’s a quick overview:</p>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">1. Choose Your Planning Mode</h4>
              <ul className="!mt-1 space-y-1">
                <li><strong>SIP:</strong> Regular disciplined investing (Monthly, Weekly, Daily, Quarterly) to harness compounding.</li>
                <li><strong>Lumpsum:</strong> One-time capital deployment with long-term CAGR appreciation.</li>
                <li><strong>Loan EMI:</strong> Calculates EMI and interest amortization for home, personal, or car loans.</li>
                <li><strong>SWP:</strong> Systematic Withdrawal Plan for steady monthly retirement income.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">2. Expected Inflation Rate & Real Value</h4>
              <p className="!mt-1">
                India's CPI inflation historically averages 5-7%. Use the <strong>Expected Inflation Rate</strong> slider to see your <strong>Real Purchasing Power</strong> (what your future terminal portfolio will actually be worth in today’s rupees).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">3. Visual Growth & Ratio Charts</h4>
              <p className="!mt-1">
                Explore the Wealth Composition pie chart and the Growth Projection graph. Toggle between <strong>Nominal Terminal Wealth</strong>, <strong>Real Purchasing Power</strong>, and <strong>Invested Principal</strong>.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">4. AI Strategic Insights & PDF Report</h4>
              <p className="!mt-1">
                Click <strong>"Analyze Plan"</strong> for risk-reward recommendations, download an executive <strong>PDF Report</strong>, or share your simulation directly to WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          Got it, let's calculate!
        </button>
      </div>
    </div>
  );
};

export default OnboardingGuide;

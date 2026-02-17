
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] p-8 space-y-6 overflow-y-auto rounded-2xl shadow-2xl animate-slide-up border dark:bg-gray-900 dark:border-gray-700 bg-white border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold dark:text-gray-100 text-gray-800">Welcome to Bharat Wealth!</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors dark:hover:bg-gray-700 hover:bg-gray-100"
            aria-label="Close guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 dark:text-gray-400 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p>This calculator is designed to help you project your investment growth. Here’s a quick guide to get you started:</p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">1. Choose Your Investment Mode</h4>
              <ul className="!mt-2">
                <li><strong>SIP (Systematic Investment Plan):</strong> Invest a fixed amount regularly (daily, weekly, etc.). Great for disciplined, long-term wealth creation through compounding.</li>
                <li><strong>Lumpsum:</strong> Invest a large, one-time amount. Ideal if you have a significant sum of money available to invest at once.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">2. Set Your Investment Details</h4>
              <ul className="!mt-2">
                <li><strong>Investment Amount:</strong> The amount you want to invest. This is a recurring amount for SIPs and a one-time amount for Lumpsum.</li>
                <li><strong>Expected Return Rate (p.a):</strong> The annual return you anticipate from your investment. A typical rate for equity mutual funds is around 12%, but you can adjust it based on your risk appetite.</li>
                <li><strong>Time Period:</strong> How many years you plan to stay invested. The longer your horizon, the more powerful compounding becomes.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">3. Understand Your Results</h4>
              <ul className="!mt-2">
                <li><strong>Result Cards:</strong> Get a quick summary of your total investment, estimated returns, and the final projected value.</li>
                <li><strong>Charts:</strong> Visualize your wealth composition (how much is principal vs. returns) and track your investment's growth year by year with the projection chart.</li>
              </ul>
            </div>
            
             <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">4. Get AI-Powered Insights</h4>
              <p className="!mt-2">Click the <strong>"Analyze Plan"</strong> button to get a personalized analysis from Gemini. It provides a summary, a pro tip, and a key consideration to help you make smarter financial decisions.</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">5. Download Your Report</h4>
              <p className="!mt-2">Click the <strong>"Report"</strong> button to download a high-quality image of your investment projection. Perfect for saving, sharing, or including in your financial planning documents.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-2.5 font-bold rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Got it, let's get started!
        </button>
      </div>
    </div>
  );
};

export default OnboardingGuide;

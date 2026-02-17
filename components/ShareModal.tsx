
import React, { useEffect } from 'react';

interface Props {
  onClose: () => void;
  shareText: string;
  appUrl: string;
}

const ShareModal: React.FC<Props> = ({ onClose, shareText, appUrl }) => {
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

  const encodedShareText = encodeURIComponent(shareText);
  const encodedAppUrl = encodeURIComponent(appUrl);

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedShareText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedAppUrl}&quote=${encodedShareText}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedShareText}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm p-8 space-y-6 rounded-2xl shadow-2xl animate-slide-up border dark:bg-gray-900 dark:border-gray-700 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-gray-100 text-gray-800">Share Your Plan</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors dark:hover:bg-gray-700 hover:bg-gray-100"
            aria-label="Close share modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 dark:text-gray-400 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={shareOnTwitter}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#1DA1F2] text-white hover:bg-[#0c85d0]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on Twitter
          </button>
          
          <button 
            onClick={shareOnFacebook}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#1877F2] text-white hover:bg-[#166fe5]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.198 21.5h4v-8.01h2.669l.398-3.001H13.198v-1.92c0-.87.243-1.464 1.488-1.464h1.588V3.54c-.275-.037-1.22-.118-2.32-.118-2.302 0-3.878 1.402-3.878 3.986v2.226H6.198v3.001h3V21.5z" />
            </svg>
            Share on Facebook
          </button>

          <button 
            onClick={shareOnWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.357 1.846 6.088l-.272 1.018 1.018-.272zM8.381 9.922c.063-.122.233-.203.448-.203.216 0 .363.048.45.09.088.042.342.39.39.776.048.386.048.721-.024.81-.072.09-.243.203-.49.335-.246.132-1.018.49-1.165.581-.147.09-.264.121-.381.077-.117-.044-.49-.176-.933-.591-.444-.415-1.018-1.18-1.09-1.378-.072-.198-.009-.304.063-.404.072-.1.167-.216.246-.288.08-.071.121-.121.184-.202.063-.081.048-.121-.012-.227-.06-.106-1.02-2.433-1.4-3.326-.379-.893-.767-.767-.999-.781-.22-.012-.48.012-.711.012-.231 0-.602.09-.913.386-.312.295-1.17 1.13-1.17 2.748s1.2 3.195 1.369 3.409c.17.215.706.941 2.37 1.938 1.663.996 2.531 1.292 3.409 1.488.878.195 1.513.15 1.984.09.47-.06 1.513-.615 1.72-1.211.208-.595.208-1.09.147-1.211-.06-.121-.216-.203-.448-.275-.231-.073-.626-.188-.711-.216z"/>
            </svg>
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

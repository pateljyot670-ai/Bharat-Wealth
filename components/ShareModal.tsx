import React, { useEffect } from 'react';
import { X, Twitter, Facebook, MessageCircle } from 'lucide-react';

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
            <X className="h-6 w-6 dark:text-gray-400 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={shareOnTwitter}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#1DA1F2] text-white hover:bg-[#0c85d0]"
          >
            <Twitter className="h-5 w-5" strokeWidth={2.5} />
            Share on Twitter
          </button>
          
          <button 
            onClick={shareOnFacebook}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#1877F2] text-white hover:bg-[#166fe5]"
          >
            <Facebook className="h-5 w-5" strokeWidth={2.5} />
            Share on Facebook
          </button>

          <button 
            onClick={shareOnWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-3 font-bold rounded-lg transition-colors bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

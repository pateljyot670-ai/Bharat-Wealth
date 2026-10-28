import React, { useEffect, useState } from 'react';
import { X, Twitter, Facebook, MessageCircle, Copy, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  shareText: string;
  appUrl: string;
}

const ShareModal: React.FC<Props> = ({ onClose, shareText, appUrl }) => {
  const [copied, setCopied] = useState(false);

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

  const encodedShareText = encodeURIComponent(`${shareText}\n\n${appUrl}`);
  const encodedAppUrl = encodeURIComponent(appUrl);

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedShareText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedAppUrl}&quote=${encodedShareText}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnWhatsApp = async () => {
    const textToShare = `${shareText}\n\n👉 Try Bharat Wealth now: ${appUrl}`;

    // 1. Try Navigator Share API if on mobile device (best for APK, supports native Android share panel which opens WhatsApp)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bharat Wealth Report',
          text: textToShare,
          url: appUrl
        });
        return; // Success!
      } catch (err) {
        console.log('Navigator share failed or cancelled, falling back to direct WhatsApp link.', err);
      }
    }

    // 2. Fallback to direct WhatsApp Link
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const encodedText = encodeURIComponent(textToShare);
    
    // On mobile devices (and inside Android APK webviews), "whatsapp://send?text=" is the most reliable way 
    // to open the WhatsApp app directly. On desktop, api.whatsapp.com is best.
    const whatsappUrl = isMobile 
      ? `whatsapp://send?text=${encodedText}` 
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    try {
      if (isMobile) {
        // Use window.location instead of window.open inside mobile APK webviews to prevent opening blank windows
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to launch WhatsApp URL scheme:', err);
      // Absolute fallback
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${appUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm p-6 sm:p-8 space-y-6 rounded-3xl shadow-2xl animate-slide-up border dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black dark:text-white text-slate-900">Share Your Plan</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors dark:hover:bg-slate-800 hover:bg-slate-100 cursor-pointer"
            aria-label="Close share modal"
          >
            <X className="h-5 w-5 dark:text-slate-400 text-slate-500" />
          </button>
        </div>
        
        <div className="space-y-3.5">
          <button 
            onClick={shareOnWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-3.5 font-bold rounded-xl transition-all bg-[#25D366] text-white hover:bg-[#128C7E] shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            Share on WhatsApp
          </button>

          <button 
            onClick={shareOnTwitter}
            className="w-full flex items-center justify-center gap-3 py-3.5 font-bold rounded-xl transition-all bg-[#1DA1F2] text-white hover:bg-[#0c85d0] shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Twitter className="h-5 w-5" strokeWidth={2.5} />
            Share on Twitter / X
          </button>
          
          <button 
            onClick={shareOnFacebook}
            className="w-full flex items-center justify-center gap-3 py-3.5 font-bold rounded-xl transition-all bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Facebook className="h-5 w-5" strokeWidth={2.5} />
            Share on Facebook
          </button>

          <div className="pt-1">
            <button 
              onClick={copyToClipboard}
              className={`w-full flex items-center justify-center gap-3 py-3.5 font-bold rounded-xl transition-all border cursor-pointer active:scale-95 ${
                copied 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300' 
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 text-slate-500 dark:text-slate-400" strokeWidth={2.5} />
                  Copy Plan Summary
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

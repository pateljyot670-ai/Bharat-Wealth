
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';
import { SIPInputs, SIPResults, LoanInputs, LoanResults, SWPInputs, SWPResults, CalculationMode } from '../types';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIChatbotProps {
  mode: CalculationMode;
  sipInputs: SIPInputs;
  loanInputs: LoanInputs;
  swpInputs: SWPInputs;
  results: SIPResults | LoanResults | SWPResults;
  darkMode: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  mode, sipInputs, loanInputs, swpInputs, results, 
  darkMode, isOpen, setIsOpen 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const initialMessage: Message = {
    role: 'ai',
    text: `Namaste! I'm Bharat Wealth AI. How can I help you with your ${mode} plan today?`,
    timestamp: new Date(),
  };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showConfirmRestart, setShowConfirmRestart] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleRestart = () => {
    setMessages([{ ...initialMessage, timestamp: new Date() }]);
    setInput('');
    setIsLoading(false);
    setShowConfirmRestart(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        mode,
        inputs: mode === 'SIP' || mode === 'Lumpsum' ? sipInputs : mode === 'Loan' ? loanInputs : swpInputs,
        results
      };
      const response = await chatWithAI(input, context);
      const aiMessage: Message = {
        role: 'ai',
        text: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'ai',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 p-3.5 sm:p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 z-40 flex items-center justify-center gap-2 group cursor-pointer border-none outline-none"
        aria-label="Ask AI"
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="hidden sm:inline max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-sm">
          Ask AI
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl sm:rounded-3xl shadow-2xl z-50 flex flex-col transition-all duration-300 overflow-hidden border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } ${isMinimized ? 'h-16' : 'h-[460px] sm:h-[500px]'}`}
    >
      {/* Header */}
      <div className="p-4 bg-indigo-600 text-white flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Bharat Wealth AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] opacity-80">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowConfirmRestart(true); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Restart Chat"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Confirmation Overlay */}
          {showConfirmRestart && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
              <div className={`p-6 rounded-2xl shadow-xl w-full max-w-[280px] ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Restart Chat?</h4>
                <p className={`text-xs mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  This will clear all current messages. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmRestart(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                      darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : darkMode 
                        ? 'bg-slate-800 text-slate-100 rounded-tl-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`p-3 rounded-2xl rounded-tl-none ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your plan..."
                className={`w-full pl-4 pr-12 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-2 text-slate-400 px-1">
              <span>AI can make mistakes. Verify info.</span>
              <a 
                href="https://wa.me/919274268295?text=Namaste!%20I%20would%20like%20more%20information%20regarding%20my%20financial%20plan."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="p-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] transition-all flex items-center justify-center shadow-xs"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AIChatbot;

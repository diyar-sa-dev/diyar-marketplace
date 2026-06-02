import React, { useState } from 'react';
import { Phone, MessageCircle, Bot, X, MessageSquareText } from 'lucide-react';

export function FloatingContactBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-3">
      {isOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Chatbot */}
          <button 
            className="flex items-center gap-2 group relative bg-white border border-gray-100 shadow-lg text-diyar-dark p-3 rounded-full hover:bg-gray-50 transition-all font-bold text-sm"
            title="المساعد الذكي (AI)"
          >
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              المساعد الذكي
            </span>
            <Bot size={22} className="text-blue-600" />
          </button>

          {/* Call Us */}
          <button 
            className="flex items-center gap-2 group relative bg-white border border-gray-100 shadow-lg text-diyar-dark p-3 rounded-full hover:bg-gray-50 transition-all font-bold text-sm"
            title="اتصل بنا"
          >
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              اتصل بنا
            </span>
            <Phone size={22} className="text-diyar-brown" />
          </button>
          
          {/* WhatsApp */}
          <button 
            className="flex items-center gap-2 group relative bg-green-500 shadow-lg shadow-green-500/20 text-white p-3 rounded-full hover:bg-green-600 transition-all font-bold text-sm"
            title="واتساب"
          >
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              واتساب
            </span>
            <MessageCircle size={22} />
          </button>
        </div>
      )}

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-diyar-dark text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-diyar-dark/10"
      >
        {isOpen ? <X size={26} /> : <MessageSquareText size={26} />}
      </button>
    </div>
  );
}

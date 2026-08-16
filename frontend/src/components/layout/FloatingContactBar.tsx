import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Bot, X, MessageSquareText, Sparkles } from 'lucide-react';

export function FloatingContactBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-3">
      {isOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Design Assistant */}
          <Link
            to="/ai-designer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 group relative bg-diyar-brown text-white shadow-lg shadow-diyar-brown/20 p-3 rounded-full hover:bg-diyar-dark transition-all font-bold text-sm"
            title="المساعد الشخصي"
          >
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              المساعد الشخصي
            </span>
            <Sparkles size={22} />
          </Link>

          {/* Chatbot */}
          <button
            className="flex items-center gap-2 group relative bg-white border border-gray-100 shadow-lg text-diyar-dark p-3 rounded-full hover:bg-gray-50 transition-all font-bold text-sm"
            title="مساعد ديار"
          >
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              مساعد ديار
            </span>
            <Bot size={22} className="text-diyar-dark" />
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

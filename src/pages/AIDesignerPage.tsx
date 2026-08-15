import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Camera, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  image?: string;
  products?: any[];
}

export default function AIDesignerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'أهلاً بك! نحن فريق خبراء ديار هنا لمساعدتك في تأثيث منزلك، تنسيق الألوان، أو البحث عن قطع أثاث تناسب ذوقك. كيف يمكننا مساعدتك اليوم؟',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // block: 'nearest' keeps the scroll inside the chat area (doesn't move the page/window)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      const newAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'فهمت ما تبحث عنه. بناءً على وصفك، أقترح ألواناً دافئة مثل البيج الترابي مع لمسات من الخشب الطبيعي. هذه بعض القطع التي قد تعجبك:',
        products: [
          { name: 'كنبة لوسيا ٣ مقاعد', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200', price: '4,500' },
          { name: 'طاولة قهوة نورديك', image: 'https://images.unsplash.com/photo-1533090368676-1fd25485db88?auto=format&fit=crop&q=80&w=200', price: '850' },
        ]
      };
      setMessages(prev => [...prev, newAIMessage]);
    }, 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      const newUserMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: document.dir === 'rtl' ? 'ابحث لي عن أثاث مشابه لهذه الصورة' : 'Find furniture similar to this image',
        image: imageUrl
      };

      setMessages(prev => [...prev, newUserMessage]);
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        const newAIMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'لقد قمت بتحليل الصورة. النمط المعروض هو "مودرن مينيماليست" ويتميز بالخطوط النظيفة والألوان المحايدة. وجدت بعض القطع المطابقة في متجرنا:',
          products: [
            { name: 'كرسي استرخاء مفرد', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=200', price: '1,200' },
            { name: 'مصباح أرضي مقوس', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=200', price: '450' },
          ]
        };
        setMessages(prev => [...prev, newAIMessage]);
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-gray-100 my-6" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-diyar-cream/20 rounded-full flex items-center justify-center border border-diyar-cream/30">
            <Sparkles className="text-diyar-brown" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-diyar-dark text-lg">استشارة خبراء ديار</h1>
            <p className="text-xs text-gray-500">متصل الآن - الفريق جاهز لمساعدتك</p>
          </div>
        </div>
        <Link to="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-diyar-dark transition-colors">
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-4 space-y-6 scroll-smooth">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
            
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${message.type === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-diyar-brown text-white'}`}>
              {message.type === 'user' ? <User size={20} /> : <Sparkles size={20} />}
            </div>

            {/* Content */}
            <div className={`max-w-[85%] md:max-w-[75%] ${message.type === 'user' ? 'items-end text-right' : 'items-start text-right'} flex flex-col gap-2`}>
              {message.image && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 w-64 h-64 shadow-sm">
                  <img src={message.image} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className={`px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed ${
                message.type === 'user' 
                  ? 'bg-diyar-dark text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-diyar-dark shadow-sm rounded-tl-sm'
              }`}>
                {message.content}
              </div>

              {message.products && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 w-full">
                  {message.products.map((product, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm flex flex-col gap-2 hover:border-diyar-brown transition-colors cursor-pointer group">
                      <div className="aspect-square rounded-lg overflow-hidden relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-diyar-dark line-clamp-1">{product.name}</h4>
                        <p className="text-xs text-diyar-brown font-bold mt-1">{product.price} ر.س</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-diyar-brown text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 w-24 flex items-center justify-center gap-1.5 shadow-sm min-h-[52px]">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-end gap-3 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:text-diyar-brown hover:bg-diyar-cream/10 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-diyar-brown/50"
          >
            <ImageIcon size={22} />
          </button>
          
          <div className="relative flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-diyar-brown focus-within:ring-1 focus-within:ring-diyar-brown transition-all overflow-hidden flex items-end min-h-[52px]">
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none px-4 py-3.5 text-sm md:text-base max-h-32 text-diyar-dark"
              placeholder="ابحث عن أثاث، اسأل عن تنسيق الألوان، أو شارك أفكارك..."
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ minHeight: '52px' }}
            />
          </div>
          
          <button 
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              inputValue.trim() 
                ? 'bg-diyar-brown text-white hover:bg-[#8A6D46] shadow-md shadow-diyar-brown/20' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} className={inputValue.trim() ? 'mr-1' : ''} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
          قد تختلف تفاصيل المنتجات، يرجى التحقق من المواصفات قبل الشراء.
        </p>
      </div>
    </div>
  );
}

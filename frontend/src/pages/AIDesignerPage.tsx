import React, { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendAssistantChat } from '../api/assistant.ts';
import { useAssistantCatalogContext } from '../hooks/assistant/useAssistantCatalog.ts';
import { useLocale } from '../hooks/useLocale.ts';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  image?: string;
}

export default function AIDesignerPage() {
  const { t, locale, dir } = useLocale();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowRight;
  const { catalogContext } = useAssistantCatalogContext(locale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: t('layout.assistant.welcome'),
      },
    ]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendToAssistant = async (userText: string) => {
    const history = [...messages, { id: `u-${Date.now()}`, type: 'user' as const, content: userText }]
      .filter((message) => message.id !== 'welcome')
      .slice(-12);

    try {
      const reply = await sendAssistantChat({
        messages: history.map((message) => ({
          role: message.type,
          content: message.content,
        })),
        catalog_context: catalogContext,
        locale,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          type: 'assistant',
          content: reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          type: 'assistant',
          content: t('layout.assistant.error'),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) {
      return;
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);
    void sendToAssistant(trimmed);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const prompt =
      locale === 'ar'
        ? 'لدي هذه الصورة لغرفة/قطعة أثاث. ساعدني في اقتراح أثاث وألوان متناسقة من ديار.'
        : 'I have this room/furniture photo. Suggest matching furniture and colors from Diyar.';

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      image: imageUrl,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsTyping(true);
    void sendToAssistant(prompt);
    event.target.value = '';
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-140px)] bg-gray-50 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-gray-100 my-6"
      dir={dir}
    >
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-diyar-cream/20 rounded-full flex items-center justify-center border border-diyar-cream/30">
            <Sparkles className="text-diyar-brown" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-diyar-dark text-lg">{t('layout.assistant.title')}</h1>
            <p className="text-xs text-green-600 font-medium">{t('layout.assistant.online')}</p>
          </div>
        </div>
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-diyar-dark transition-colors cursor-pointer"
        >
          <BackIcon size={20} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-4 space-y-6 scroll-smooth">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                message.type === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-diyar-brown text-white'
              }`}
            >
              {message.type === 'user' ? <User size={20} /> : <Sparkles size={20} />}
            </div>

            <div
              className={`max-w-[85%] md:max-w-[75%] ${
                message.type === 'user' ? 'items-end text-right' : 'items-start text-right'
              } flex flex-col gap-2`}
            >
              {message.image ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 w-64 h-64 shadow-sm">
                  <img src={message.image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : null}

              <div
                className={`px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                  message.type === 'user'
                    ? 'bg-diyar-dark text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-diyar-dark shadow-sm rounded-tl-sm'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isTyping ? (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-diyar-brown text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2 shadow-sm min-h-13">
              <Loader2 size={16} className="animate-spin text-diyar-brown" />
              <span className="text-sm text-gray-500">{t('layout.assistant.thinking')}</span>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

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
            className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:text-diyar-brown hover:bg-diyar-cream/10 transition-colors shrink-0 outline-none focus:ring-2 focus:ring-diyar-brown/50 cursor-pointer"
          >
            <ImageIcon size={22} />
          </button>

          <div className="relative flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-diyar-brown focus-within:ring-1 focus-within:ring-diyar-brown transition-all overflow-hidden flex items-end min-h-13">
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none px-4 py-3.5 text-sm md:text-base max-h-32 text-diyar-dark min-h-13"
              placeholder={t('layout.assistant.placeholder')}
              rows={1}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              inputValue.trim() && !isTyping
                ? 'bg-diyar-brown text-white hover:bg-[#8A6D46] shadow-md shadow-diyar-brown/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
          {t('layout.assistant.disclaimer')}
        </p>
      </div>
    </div>
  );
}

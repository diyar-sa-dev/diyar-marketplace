import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Paperclip, Search, ArrowRight, MessageSquare, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

type Msg = { id: number; from: 'me' | 'them' | 'system'; text: string };
type Conversation = {
  id: string;
  provider: string;
  service?: string;
  unread?: number;
  messages: Msg[];
  // when the conversation was opened from a proposal, the service is added
  // to the cart only once the user actually sends the first message
  cartPayload?: { name: string; vendor: string; price: string | number };
  cartAdded?: boolean;
};

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    provider: 'إيوان للتصميم',
    service: 'تصميم داخلي متكامل',
    messages: [
      {
        id: 1,
        from: 'them',
        text: 'أهلاً بك! تم استلام المخططات وسنوافيك بالتصور الأولي خلال يومين.',
      },
      { id: 2, from: 'me', text: 'ممتاز، بانتظاركم.' },
    ],
  },
  {
    id: 'c2',
    provider: 'نجارة العاصمة',
    service: 'صيانة وإصلاح أبواب خشبية',
    unread: 1,
    messages: [{ id: 1, from: 'them', text: 'تم إنجاز العمل، نتمنى أن تشاركنا تقييمك 🌟' }],
  },
];

export default function ChatPage() {
  const location = useLocation();
  const { addItem } = useCart();

  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // If we arrived from a proposal ("محادثة"), open/create that conversation
  useEffect(() => {
    const s = location.state as {
      provider?: string;
      title?: string;
      price?: string | number;
    } | null;
    if (s?.provider) {
      setConversations((prev) => {
        const existing = prev.find((c) => c.provider === s.provider && c.service === s.title);
        if (existing) {
          setActiveId(existing.id);
          return prev;
        }
        const conv: Conversation = {
          id: `c-${Date.now()}`,
          provider: s.provider!,
          service: s.title,
          messages: [
            {
              id: 1,
              from: 'them',
              text: `مرحباً بك 👋 معك ${s.provider}. شكراً لاهتمامك بعرضنا${s.title ? ` بخصوص "${s.title}"` : ''}. كيف يمكنني خدمتك؟`,
            },
          ],
          cartPayload: { name: s.title || 'خدمة', vendor: s.provider!, price: s.price ?? 0 },
          cartAdded: false,
        };
        setActiveId(conv.id);
        return [conv, ...prev];
      });
      setShowThreadOnMobile(true);
      // clear router state so a refresh doesn't re-create the conversation
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active?.messages.length, isTyping]);

  const openConversation = (id: string) => {
    setActiveId(id);
    setShowThreadOnMobile(true);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const send = () => {
    const text = input.trim();
    if (!text || !active) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== active.id) return c;
        const msgs: Msg[] = [...c.messages, { id: Date.now(), from: 'me', text }];
        let cartAdded = c.cartAdded;
        // starting the chat = first sent message → service goes to the cart
        if (c.cartPayload && !c.cartAdded) {
          addItem({
            type: 'service',
            name: c.cartPayload.name,
            vendor: c.cartPayload.vendor,
            price: c.cartPayload.price,
            attributes: 'محادثة مع المزود',
          });
          msgs.push({ id: Date.now() + 1, from: 'system', text: 'تمت إضافة الخدمة إلى سلتك 🛒' });
          cartAdded = true;
        }
        return { ...c, messages: msgs, cartAdded };
      }),
    );
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: Date.now() + 2,
                    from: 'them',
                    text: 'تمام، سأراجع التفاصيل وأوافيك بالمقاسات والسعر النهائي قريباً. هل يمكنك مشاركة صور للمساحة؟',
                  },
                ],
              }
            : c,
        ),
      );
    }, 1600);
  };

  const filtered = conversations.filter(
    (c) => c.provider.includes(query) || (c.service || '').includes(query),
  );

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-8">
        <div className="bg-white md:rounded-3xl md:border md:border-gray-100 md:shadow-sm overflow-hidden flex h-[calc(100dvh-160px)] md:h-[calc(100vh-220px)] min-h-[480px]">
          {/* Conversations list */}
          <aside
            className={`w-full md:w-80 lg:w-96 border-l border-gray-200 flex-col bg-white shrink-0 ${showThreadOnMobile ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="p-4 border-b border-gray-100">
              <h1 className="font-bold text-lg text-diyar-dark mb-3">الرسائل</h1>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث في المحادثات..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm outline-none focus:bg-white focus:border-diyar-brown transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-12 px-4">
                  لا توجد محادثات مطابقة
                </div>
              )}
              {filtered.map((c) => {
                const last = c.messages.filter((m) => m.from !== 'system').slice(-1)[0];
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-right border-b border-gray-100 transition-colors border-r-[3px] ${isActive ? 'bg-diyar-cream/70 border-r-diyar-brown' : 'border-r-transparent hover:bg-gray-50'}`}
                  >
                    <div className="w-11 h-11 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold border border-diyar-brown/20 shrink-0">
                      {c.provider.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-diyar-dark truncate">
                          {c.provider}
                        </span>
                        {c.unread ? (
                          <span className="bg-diyar-brown text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {c.unread}
                          </span>
                        ) : null}
                      </div>
                      {c.service && (
                        <span className="block text-[11px] text-diyar-brown truncate mt-0.5">
                          {c.service}
                        </span>
                      )}
                      <span className="block text-xs text-gray-400 truncate mt-0.5">
                        {last?.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Thread */}
          <section
            className={`flex-1 flex-col bg-diyar-cream/30 min-w-0 ${showThreadOnMobile ? 'flex' : 'hidden md:flex'}`}
          >
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <div className="w-16 h-16 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                  <MessageSquare size={26} className="text-diyar-brown" />
                </div>
                <p className="font-bold text-diyar-dark mb-1">اختر محادثة</p>
                <p className="text-sm">اختر محادثة من القائمة لعرض الرسائل.</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white shrink-0">
                  <button
                    onClick={() => setShowThreadOnMobile(false)}
                    className="md:hidden w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold border border-diyar-brown/20 shrink-0">
                    {active.provider.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-diyar-dark text-sm leading-tight truncate">
                      {active.provider}
                    </h2>
                    <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> متصل الآن
                    </span>
                  </div>
                  {active.service && (
                    <span className="hidden sm:block bg-gray-50 border border-gray-100 text-gray-500 text-[11px] font-medium px-3 py-1.5 rounded-lg truncate max-w-[220px]">
                      {active.service}
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {active.messages.map((m) =>
                    m.from === 'system' ? (
                      <div key={m.id} className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 bg-diyar-cream/60 border border-diyar-cream text-diyar-brown text-[11px] font-bold px-3 py-1.5 rounded-full">
                          <ShoppingCart size={12} /> {m.text}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={m.id}
                        className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] md:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === 'me' ? 'bg-diyar-dark text-white rounded-tl-sm shadow-sm' : 'bg-white border border-gray-200 text-diyar-dark rounded-tr-sm shadow-sm'}`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ),
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tr-sm px-4 py-3 flex gap-1.5 shadow-sm">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                        <span
                          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: '0.15s' }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: '0.3s' }}
                        ></span>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-diyar-brown transition shrink-0">
                      <Paperclip size={18} />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') send();
                      }}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-diyar-brown transition"
                    />
                    <button
                      onClick={send}
                      disabled={!input.trim()}
                      className="w-10 h-10 rounded-xl bg-diyar-brown text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-diyar-dark transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

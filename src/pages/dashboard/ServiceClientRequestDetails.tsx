import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, MapPin, DollarSign, Clock, Paperclip, Send, CheckCircle2, Upload } from 'lucide-react';

const MOCK_REQUEST = {
  id: 'REQ-1025',
  customerName: 'أحمد عبدالله',
  category: 'تصميم داخلي',
  title: 'طلب تصميم صالة جلوس مودرن',
  description: 'أحتاج مصمم داخلي لتصميم صالة جلوس بمساحة 20 متر مربع مع غرفة طعام. المفضل نمط مودرن مع ألوان هادئة. أحب الاستايل الإسكندنافي والخشب الفاتح. الصالة حالياً فارغة تماماً وأحتاج لتصميم ثلاثي الأبعاد مع مخطط توزيع الأثاث.',
  budget: '1000 - 1500 ر.س',
  location: 'الرياض, حي الياسمين',
  date: 'قبل ساعتين',
  status: 'open',
  attachments: [
    { name: 'dimensions.pdf', size: '2.4 MB', type: 'pdf' },
    { name: 'inspiration_1.jpg', size: '1.1 MB', type: 'image' },
  ],
};

export default function ServiceClientRequestDetails() {
  const { id } = useParams();
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Link 
          to="/dashboard/service/client-requests" 
          className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-diyar-dark">تفاصيل الطلب: {id?.toUpperCase() || MOCK_REQUEST.id}</h1>
          <p className="text-gray-500 text-sm mt-1">تصفح تفاصيل الطلب بدقة قبل تقديم عرضك.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="inline-block px-4 py-2 bg-diyar-cream/30 text-diyar-brown text-sm font-bold rounded-lg truncate">
                {MOCK_REQUEST.category}
              </span>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Clock size={16} /> {MOCK_REQUEST.date}
              </span>
            </div>

            <h2 className="text-xl font-bold text-diyar-dark mb-4">{MOCK_REQUEST.title}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
              {MOCK_REQUEST.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-diyar-brown shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">الموقع</p>
                  <p className="font-bold text-gray-800">{MOCK_REQUEST.location}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-diyar-brown shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">الميزانية المقترحة</p>
                  <p className="font-bold text-gray-800" dir="ltr">{MOCK_REQUEST.budget}</p>
                </div>
              </div>
            </div>

            {MOCK_REQUEST.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                  <Paperclip size={20} className="text-gray-400" />
                  المرفقات ({MOCK_REQUEST.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {MOCK_REQUEST.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="p-2 bg-white rounded-lg text-diyar-brown shadow-sm">
                        <Paperclip size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold text-diyar-dark mb-6">تقديم عرض سعر</h3>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">تم تقديم العرض بنجاح!</h4>
                <p className="text-gray-500 text-sm">سيقوم العميل بمراجعة عرضك والتواصل معك عند الموافقة.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 text-diyar-brown font-bold text-sm hover:underline"
                >
                  تقديم عرض جديد
                </button>
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} className="space-y-5 flex-1 flex flex-col">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">السعر المقترح (ر.س) *</label>
                  <input 
                    type="number"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="مثال: 1200"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-diyar-brown focus:bg-white outline-none transition-all"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-bold text-gray-700 mb-2">رسالة للعميل *</label>
                  <textarea 
                    required
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="اشرح خطتك للعمل، متى يمكنك البدء، ولماذا يجب أن يختارك العميل..."
                    className="w-full h-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-diyar-brown focus:bg-white outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملف عرض السعر (اختياري)</label>
                  <div className="relative">
                    <input type="file" className="hidden" id="offer-file" />
                    <label 
                      htmlFor="offer-file"
                      className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:border-diyar-brown transition-colors cursor-pointer"
                    >
                      <Upload size={16} className="text-gray-400" />
                      <span>إرفاق ملف (PDF, JPG, PNG)</span>
                    </label>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-diyar-brown text-white py-3.5 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      تأكيد تقديم العرض
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

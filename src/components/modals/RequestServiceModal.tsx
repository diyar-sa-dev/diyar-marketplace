import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, DollarSign, FileText, Tags, Send, CheckCircle2, ConciergeBell, Check } from 'lucide-react';

interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_CATEGORIES = [
  'تصميم داخلي',
  'تركيب وصيانة',
  'تنجيد وتجديد',
  'مخططات معمارية',
  'نقل وتغليف',
  'أخرى'
];

export function RequestServiceModal({ isOpen, onClose }: RequestServiceModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [links, setLinks] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setDescription('');
      setSelectedCategories([]);
      setBudget('');
      setLinks('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-none md:rounded-3xl w-full h-[100dvh] md:h-auto max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 pb-6 md:px-8 md:pb-7 pt-[calc(env(safe-area-inset-top,0px)+2rem)] flex justify-between items-start gap-4 relative overflow-hidden shrink-0 rounded-none md:rounded-t-3xl">
          <div className="absolute inset-0 bg-diyar-cream/20"></div>
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0 border border-diyar-brown/15">
              <ConciergeBell size={22} />
            </div>
            <div className="pt-0.5">
              <h2 className="text-xl md:text-2xl font-bold text-diyar-dark leading-snug">طلب تنفيذ مخصص</h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">صف ما تريد تنفيذه وسنوصلك بأفضل المختصين</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shadow-sm relative z-10 shrink-0 mr-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar rounded-none md:rounded-b-3xl">
          {isSubmitted ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-diyar-dark mb-2">تم استلام طلبك بنجاح!</h3>
              <p className="text-gray-500">سيقوم فريقنا بدراسة الطلب والتواصل معك قريباً.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-diyar-brown" />
                  تفاصيل الخدمة المطلوبة <span className="text-diyar-brown">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح بالتفصيل ما الذي تحتاجه (مثال: أحتاج مصمم داخلي لتصميم صالة جلوس بمساحة 20 متر مربع...)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Category (multi-select) */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                  <Tags size={16} className="text-diyar-brown" />
                  تصنيف الخدمة <span className="text-diyar-brown">*</span>
                  <span className="text-gray-400 font-medium text-xs">
                    {selectedCategories.length > 0 ? `(${selectedCategories.length} مختار)` : '(يمكنك اختيار أكثر من تصنيف)'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map(category => {
                    const active = selectedCategories.includes(category);
                    return (
                      <button
                        type="button"
                        key={category}
                        onClick={() => toggleCategory(category)}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${active ? 'bg-diyar-brown text-white border-diyar-brown shadow-sm shadow-diyar-brown/20' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-diyar-brown/40 hover:text-diyar-dark'}`}
                      >
                        {active && <Check size={15} />}
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-diyar-brown" />
                  الميزانية المقترحة (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="مثال: 500 - 1000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ر.س</span>
                </div>
              </div>

              {/* Attachments & Links */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4">المرفقات (اختياري)</h4>
                
                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <input type="file" ref={fileInputRef} className="hidden" multiple />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center justify-center text-gray-500 hover:border-diyar-brown hover:bg-diyar-cream/10 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:text-diyar-brown">
                        <Upload size={20} />
                      </div>
                      <span className="font-medium text-sm">اضغط لرفع صور أو ملفات</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (أقصى حجم 10MB)</span>
                    </button>
                  </div>

                  {/* Links */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                      <LinkIcon size={14} />
                      روابط مرجعية
                    </label>
                    <input
                      type="text"
                      value={links}
                      onChange={(e) => setLinks(e.target.value)}
                      placeholder="لصق روابط لصور أو ملفات خارجية..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={selectedCategories.length === 0}
                  className="flex-1 bg-diyar-brown text-white py-3.5 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send size={18} />
                  إرسال الطلب
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

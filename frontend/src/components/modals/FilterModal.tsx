import React, { useState } from 'react';
import {
  X,
  Star,
  ChevronDown,
  Check,
  Sparkles,
  SlidersHorizontal,
  Package,
  Wrench,
  ChevronLeft,
} from 'lucide-react';

export function FilterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'ai'>('products');

  // Product States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [toggles, setToggles] = useState({ new: false, bestSelling: false, offers: false });

  // Service States
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);

  // AI States
  const [aiRoomSize, setAiRoomSize] = useState<string>('');
  const [aiBudget, setAiBudget] = useState<string>('');
  const [aiStyle, setAiStyle] = useState<string>('');
  const [aiServiceType, setAiServiceType] = useState<string>('');

  if (!isOpen) return null;

  const toggleSelection = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter((prev: string[]) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const renderProductFilters = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* الفئة */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">الفئة</h3>
        <div className="flex flex-wrap gap-2">
          {['منتج', 'خدمة'].map((type) => (
            <button
              key={type}
              onClick={() => toggleSelection(setSelectedTypes, type)}
              className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold ${selectedTypes.includes(type) ? 'border-diyar-brown bg-diyar-brown text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* السعر */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">السعر (ريال)</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="من"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-diyar-brown outline-none transition-all text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="إلى"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-diyar-brown outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* اللون */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">اللون</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'أبيض', class: 'bg-white border-gray-200' },
            { name: 'أسود', class: 'bg-black border-black' },
            { name: 'بني', class: 'bg-amber-800 border-amber-800' },
            { name: 'خشبي', class: 'bg-[#C19A6B] border-[#C19A6B]' },
            { name: 'رمادي', class: 'bg-gray-400 border-gray-400' },
            { name: 'أزرق', class: 'bg-blue-800 border-blue-800' },
            { name: 'أخضر', class: 'bg-emerald-700 border-emerald-700' },
          ].map((color) => (
            <button
              key={color.name}
              onClick={() => toggleSelection(setSelectedColors, color.name)}
              className={`w-8 h-8 rounded-full border shadow-sm relative flex items-center justify-center transition-transform hover:scale-110 ${color.class}`}
              title={color.name}
            >
              {selectedColors.includes(color.name) && (
                <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-diyar-brown pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* النمط */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">النمط</h3>
        <div className="flex flex-wrap gap-2">
          {['نيوكلاسيك', 'مودرن', 'تراثي نجدي', 'بوهيمي', 'صناعي', 'كلاسيك'].map((style) => (
            <button
              key={style}
              onClick={() => toggleSelection(setSelectedStyles, style)}
              className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold ${selectedStyles.includes(style) ? 'border-diyar-brown bg-diyar-brown text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* الخامة */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">الخامة</h3>
        <div className="flex flex-wrap gap-2">
          {['خشب زان', 'مخمل', 'رخام', 'ستيل', 'جلد', 'زجاج'].map((mat) => (
            <button
              key={mat}
              onClick={() => toggleSelection(setSelectedMaterials, mat)}
              className={`px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${selectedMaterials.includes(mat) ? 'border-[#132624] bg-[#132624] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>

      {/* المساحة */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">المساحة</h3>
        <div className="flex flex-wrap gap-2">
          {['غرفة معيشة', 'غرفة نوم', 'مطبخ', 'مجلس ضيافة', 'مكتب'].map((space) => (
            <button
              key={space}
              onClick={() => toggleSelection(setSelectedSpaces, space)}
              className={`px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${selectedSpaces.includes(space) ? 'border-[#132624] bg-[#132624] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              {space}
            </button>
          ))}
        </div>
      </div>

      {/* Checkboxes (جديد, مبيعاً, عروض) */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${toggles.new ? 'bg-diyar-brown border-diyar-brown' : 'border-gray-300 group-hover:border-diyar-brown'}`}
          >
            {toggles.new && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">جديد</span>
          <input
            type="checkbox"
            className="hidden"
            checked={toggles.new}
            onChange={() => setToggles({ ...toggles, new: !toggles.new })}
          />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${toggles.bestSelling ? 'bg-diyar-brown border-diyar-brown' : 'border-gray-300 group-hover:border-diyar-brown'}`}
          >
            {toggles.bestSelling && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">الأعلى مبيعًا</span>
          <input
            type="checkbox"
            className="hidden"
            checked={toggles.bestSelling}
            onChange={() => setToggles({ ...toggles, bestSelling: !toggles.bestSelling })}
          />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${toggles.offers ? 'bg-diyar-brown border-diyar-brown' : 'border-gray-300 group-hover:border-diyar-brown'}`}
          >
            {toggles.offers && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">العروض</span>
          <input
            type="checkbox"
            className="hidden"
            checked={toggles.offers}
            onChange={() => setToggles({ ...toggles, offers: !toggles.offers })}
          />
        </label>
      </div>

      {/* التاجر */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-diyar-dark">التاجر / المتجر</h3>
        <div className="relative">
          <select className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm font-bold text-diyar-dark appearance-none focus:bg-white focus:border-diyar-brown outline-none transition-all cursor-pointer">
            <option value="">الكل</option>
            <option value="ikea">إيكيا (IKEA)</option>
            <option value="homecentre">هوم سنتر (Home Centre)</option>
            <option value="abayat">أبيات (Abyat)</option>
            <option value="almutlaq">مفروشات المطلق</option>
            <option value="midas">ميداس (Midas)</option>
          </select>
          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
        </div>
      </div>
    </div>
  );

  const renderServiceFilters = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark mb-4">مجال الخدمة</h3>
        <div className="flex flex-col gap-3">
          {['سكني', 'فندقي', 'تجاري', 'مكاتب', 'مشاريع كاملة'].map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 cursor-pointer group bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedServiceTypes.includes(type) ? 'bg-diyar-brown border-diyar-brown text-white' : 'border-gray-300 group-hover:border-diyar-brown'}`}
              >
                {selectedServiceTypes.includes(type) && <Check size={14} />}
              </div>
              <span className="text-sm font-bold text-diyar-dark">{type}</span>
              <input
                type="checkbox"
                className="hidden"
                checked={selectedServiceTypes.includes(type)}
                onChange={() => toggleSelection(setSelectedServiceTypes, type)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAIFilters = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3 mb-4">
        <Sparkles className="text-yellow-600 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-sm text-yellow-800 mb-1">تخصيص بالمساعد الشخصي</h4>
          <p className="text-xs text-yellow-700/80">
            ساعدنا ببعض المعلومات عن مساحتك ليقوم المساعد الشخصي باقتراح أفضل المنتجات والمخططات
            المناسبة لك بدقة.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">حسب حجم الغرفة</h3>
        <select
          value={aiRoomSize}
          onChange={(e) => setAiRoomSize(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm font-bold text-diyar-dark appearance-none focus:bg-white outline-none cursor-pointer"
        >
          <option value="">حدد الحجم (مثل: 4x5 متر)</option>
          <option value="small">صغيرة (أقل من 3x3)</option>
          <option value="medium">متوسطة (حوالي 4x4)</option>
          <option value="large">كبيرة / مجلس (أكبر من 5x5)</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">حسب الميزانية</h3>
        <select
          value={aiBudget}
          onChange={(e) => setAiBudget(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm font-bold text-diyar-dark appearance-none focus:bg-white outline-none cursor-pointer"
        >
          <option value="">حدد النطاق</option>
          <option value="economy">اقتصادية (أقل من 5,000 ريال)</option>
          <option value="mid">متوسطة (5,000 - 15,000 ريال)</option>
          <option value="luxury">فاخرة (أكثر من 15,000 ريال)</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">حسب النمط المفضل</h3>
        <select
          value={aiStyle}
          onChange={(e) => setAiStyle(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm font-bold text-diyar-dark appearance-none focus:bg-white outline-none cursor-pointer"
        >
          <option value="">اختار النمط (مودرن، كلاسيك...)</option>
          <option value="modern">مودرن عملي</option>
          <option value="neoclassic">نيوكلاسيك فخم</option>
          <option value="traditional">تراثي عربي أصيل</option>
        </select>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">نوع الخدمة المطلوبة</h3>
        <select
          value={aiServiceType}
          onChange={(e) => setAiServiceType(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm font-bold text-diyar-dark appearance-none focus:bg-white outline-none cursor-pointer"
        >
          <option value="">حدد النوع</option>
          <option value="products_only">تأثيث فقط (قطع جاهزة)</option>
          <option value="design_and_build">تصميم داخلي وتنفيذ</option>
          <option value="consultation">استشارة هندسية فقط</option>
        </select>
      </div>

      <div className="pt-2">
        <button className="w-full bg-[#132624] text-[#f3ecdb] hover:bg-black p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg">
          <Sparkles size={16} className="text-yellow-500" />
          تشغيل اقتراحات AI
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6" dir="rtl">
      <div
        className="absolute inset-0 bg-diyar-dark/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-xl flex flex-col relative z-10 shadow-2xl h-[90vh] md:h-auto md:max-h-[90vh] mt-auto md:mt-0 overflow-hidden transform transition-transform animate-in slide-in-from-bottom-5 duration-300">
        {/* Header Options */}
        <div className="flex flex-col border-b border-gray-100 bg-white z-20">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-diyar-brown" size={20} />
              <h2 className="text-xl font-bold text-diyar-dark">التصفية والفرز</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex px-4 overflow-x-auto scrollbar-hide gap-1 pb-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center ${activeTab === 'products' ? 'bg-[#132624] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Package size={16} /> المنتجات
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center ${activeTab === 'services' ? 'bg-[#132624] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Wrench size={16} /> الخدمات
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center ${activeTab === 'ai' ? 'bg-gradient-to-l from-yellow-500 to-yellow-600 text-white shadow-md' : 'text-yellow-600 bg-yellow-50 border border-yellow-100 hover:bg-yellow-100'}`}
            >
              <Sparkles size={16} /> فلاتر المساعد الشخصي
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === 'products' && renderProductFilters()}
          {activeTab === 'services' && renderServiceFilters()}
          {activeTab === 'ai' && renderAIFilters()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0 z-20">
          <button
            onClick={() => {
              if (activeTab === 'products') {
                setSelectedTypes([]);
                setSelectedColors([]);
                setSelectedStyles([]);
                setSelectedMaterials([]);
                setSelectedSpaces([]);
                setToggles({ new: false, bestSelling: false, offers: false });
              } else if (activeTab === 'services') {
                setSelectedServiceTypes([]);
              } else {
                setAiRoomSize('');
                setAiBudget('');
                setAiStyle('');
                setAiServiceType('');
              }
            }}
            className="px-5 py-3 text-diyar-dark text-sm font-bold hover:bg-gray-100 transition rounded-xl"
          >
            مسح النشط
          </button>
          <button className="flex-1 bg-diyar-brown text-white py-3 rounded-xl text-sm font-bold hover:bg-[#7a6450] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2">
            عرض النتائج <span className="bg-white/20 px-2 py-0.5 rounded text-xs">48</span>
          </button>
        </div>
      </div>
    </div>
  );
}

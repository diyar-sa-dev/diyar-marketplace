import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, Clock, X, Upload } from 'lucide-react';

export default function ServiceServices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const MOCK_SERVICES = [
    { id: 1, title: 'تصميم داخلي (غرفة جلوس)', price: 1500, duration: 'يومين', location: 'الرياض (تغطية كاملة)', isActive: true },
    { id: 2, title: 'استشارة ميدانية', price: 500, duration: 'ساعتين', location: 'شمال الرياض', isActive: true },
    { id: 3, title: 'تنسيق أثاث', price: 800, duration: 'يوم واحد', location: 'الرياض (تغطية كاملة)', isActive: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">خدماتي</h2>
          <p className="text-gray-500 text-sm mt-1">إضافة وإدارة وتعديل خدماتك المقدمة للعملاء.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن خدمة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-full md:w-64"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition">
            <Plus size={18} />
            إضافة خدمة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_SERVICES.map(service => (
          <div key={service.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
            {!service.isActive && (
              <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-bl-xl z-10">غير مفعلة</div>
            )}
            
            <h3 className={`font-bold text-lg mb-2 pt-2 ${service.isActive ? 'text-diyar-dark' : 'text-gray-400'}`}>{service.title}</h3>
            
            <div className="space-y-2 mt-4 text-sm">
               <div className="flex items-center gap-2 text-gray-600">
                 <Clock size={16} className="text-gray-400" />
                 <span>المدة: {service.duration}</span>
               </div>
               <div className="flex items-center gap-2 text-gray-600">
                 <MapPin size={16} className="text-gray-400" />
                 <span>{service.location}</span>
               </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className={`font-bold text-xl ${service.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {service.price} <span className="text-sm">ر.س</span>
              </span>
              <div className="flex gap-2">
                 <button onClick={() => setSelectedService(service)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition" title="تعديل">
                   <Edit size={16} />
                 </button>
                 <button className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition" title="حذف">
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {(isAddModalOpen || selectedService) && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">{selectedService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setSelectedService(null); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
               <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                 <Upload size={24} className="mb-2" />
                 <span className="text-sm font-medium text-diyar-dark">اضغط لرفع صور للخدمة (اختياري)</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">اسم الخدمة</label>
                   <input type="text" defaultValue={selectedService?.title || ''} placeholder="مثال: استشارة عن بعد" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">السعر (ر.س)</label>
                   <input type="number" defaultValue={selectedService?.price || ''} placeholder="0.00" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">المدة المتوقعة</label>
                   <input type="text" defaultValue={selectedService?.duration || ''} placeholder="مثال: ساعتين" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">الموقع المتاح</label>
                   <input type="text" defaultValue={selectedService?.location || ''} placeholder="مثال: جميع أنحاء الرياض" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">وصف الخدمة</label>
                 <textarea rows={3} placeholder="اكتب وصفاً مفصلاً لما تشمله الخدمة..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"></textarea>
               </div>
               
               <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                 <div>
                   <h4 className="font-bold text-sm text-diyar-dark">تفعيل الخدمة</h4>
                   <p className="text-xs text-gray-500">سيتمكن العملاء من طلب هذه الخدمة إذا كانت مفعلة</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" defaultChecked={selectedService?.isActive !== false} />
                   <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                 </label>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
               <button onClick={() => { setIsAddModalOpen(false); setSelectedService(null); }} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">إلغاء</button>
               <button onClick={() => { setIsAddModalOpen(false); setSelectedService(null); }} className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition">حفظ الخدمة</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Search, Filter, MessageSquare, DollarSign, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_REQUESTS = [
  {
    id: 'REQ-1025',
    customerName: 'أحمد عبدالله',
    category: 'تصميم داخلي',
    description: 'أحتاج مصمم داخلي لتصميم صالة جلوس بمساحة 20 متر مربع مع غرفة طعام. المفضل نمط مودرن مع ألوان هادئة. أحب الاستايل الإسكندنافي والخشب الفاتح.',
    budget: '1000 - 1500 ر.س',
    location: 'الرياض, حي الياسمين',
    date: 'قبل ساعتين',
    status: 'open',
    attachments: 2,
  },
  {
    id: 'REQ-1026',
    customerName: 'سارة محمد',
    category: 'نقل وتغليف',
    description: 'ابغى شركة نقل لنقل أثاث شقة 3 غرف من الدور الثاني الى الدور الارضي في نفس الحي. احتاج فك وتركيب لغرفتين نوم مع التغليف.',
    budget: 'غير محدد',
    location: 'جدة, حي الشاطئ',
    date: 'قبل 5 ساعات',
    status: 'open',
    attachments: 0,
  },
  {
    id: 'REQ-1027',
    customerName: 'فيصل العتيبي',
    category: 'تركيب وصيانة',
    description: 'عندي دولاب كبير حق ايكيا (باكس) يحتاج تركيب، بالإضافة لتركيب 3 ستاير مع شاشتين على الجدار.',
    budget: '300 ر.س',
    location: 'الدمام, حي الفيصلية',
    date: 'البارحة',
    status: 'offered',
    attachments: 1,
  }
];

export default function ServiceClientRequests() {
  const [activeTab, setActiveTab] = useState<'open' | 'offered'>('open');

  const filteredRequests = MOCK_REQUESTS.filter(req => req.status === activeTab);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-diyar-dark mb-2">طلبات العملاء</h1>
        <p className="text-gray-500">تصفح الطلبات الخاصة التي قدمها العملاء وقدم عروض أسعارك ليتم اختيارك.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'open' ? 'bg-diyar-brown text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            الطلبات المتاحة
          </button>
          <button 
            onClick={() => setActiveTab('offered')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'offered' ? 'bg-diyar-brown text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            عروضي المقدمة
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="ابحث في الطلبات..."
              className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
          <button className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map(request => (
          <Link to={`/dashboard/service/client-requests/${request.id}`} key={request.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col p-5 group block focus:outline-none focus:ring-2 focus:ring-diyar-brown focus:border-transparent">
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block px-3 py-1 bg-diyar-cream/30 text-diyar-brown text-xs font-bold rounded-lg truncate max-w-[150px]">
                {request.category}
              </span>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Clock size={12} /> {request.date}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-800 mb-2 truncate group-hover:text-diyar-brown transition-colors">طلب {request.customerName}</h3>
            
            <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
              {request.description}
            </p>
            
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={14} className="text-gray-400" />
                <span>{request.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <DollarSign size={14} className="text-gray-400" />
                <span className="font-medium text-gray-700">الميزانية: <span dir="ltr">{request.budget}</span></span>
              </div>
            </div>
            
            <hr className="border-gray-50 mb-4" />
            
            {activeTab === 'open' ? (
              <div className="w-full bg-diyar-brown text-white py-2 rounded-xl text-sm font-bold text-center group-hover:bg-[#8A6D46] transition-colors">
                عرض التفاصيل
              </div>
            ) : (
              <div className="w-full bg-green-50 text-green-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> تم تقديم العرض
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center">
          <MessageSquare size={48} className="text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد طلبات هنا حالياً</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            قم بالتحقق مجدداً في وقت لاحق لرؤية الطلبات الجديدة المقدمة من قبل العملاء.
          </p>
        </div>
      )}
    </div>
  );
}

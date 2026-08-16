import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Paintbrush,
  FileText,
  MessageSquare,
  Star,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MOCK_REQUESTS = [
  {
    id: '#REQ-89012',
    type: 'تفصيل أثاث',
    icon: <Wrench size={20} />,
    title: 'تفصيل طقم كنب مجلس عربي',
    date: '2024-05-18',
    status: 'offers_received', // pending, offers_received, in_progress, completed, cancelled
    offersCount: 3,
    description: 'أرغب بتفصيل طقم كنب لمجلس بمساحة 5x6 متر، تصميم عصري بألوان محايدة...',
  },
  {
    id: '#REQ-89005',
    type: 'تصميم داخلي',
    icon: <Paintbrush size={20} />,
    title: 'تصميم 3D لصالة استقبال',
    date: '2024-05-15',
    status: 'in_progress',
    offersCount: 5,
    selectedProvider: 'مؤسسة إبداع التصميم',
    price: '1,500 ر.س',
    description: 'تصميم 3D كامل مع المخططات لصالة مفتوحة...',
  },
  {
    id: '#REQ-88950',
    type: 'صيانة',
    icon: <Wrench size={20} />,
    title: 'صيانة وإصلاح أبواب خشبية',
    date: '2024-05-01',
    status: 'completed',
    offersCount: 2,
    selectedProvider: 'نجارة العاصمة',
    price: '450 ر.س',
    description: 'يوجد لدي 3 أبواب داخلية تحتاج إلى تغيير المفصلات وصيانة الأقفال.',
  },
];

const MOCK_OFFERS = [
  {
    id: 'off_1',
    providerName: 'مصنع فخامة الخشب',
    rating: 4.8,
    reviewsCount: 124,
    price: '4,500 ر.س',
    duration: '14 يوم',
    description: 'نضمن لك استخدام أفضل أنواع الإسفنج والخشب الزان. السعر يشمل التوصيل داخل الرياض.',
    date: 'اليوم',
  },
  {
    id: 'off_2',
    providerName: 'المجلس الأنيق',
    rating: 4.5,
    reviewsCount: 86,
    price: '3,800 ر.س',
    duration: '10 أيام',
    description:
      'يوجد لدينا تصاميم جاهزة يمكنك الاختيار منها لتسريع وقت التنفيذ. السعر قابل للتفاوض البسيط.',
    date: 'أمس',
  },
  {
    id: 'off_3',
    providerName: 'مفروشات الرياض',
    rating: 4.9,
    reviewsCount: 310,
    price: '5,200 ر.س',
    duration: '20 يوم',
    description:
      'السعر يشمل معاينة الموقع وأخذ المقاسات الدقيقة وتقديم عينات الأقمشة قبل البدء بالتنفيذ.',
    date: 'أمس',
  },
];

export default function ServiceRequestsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
            بانتظار العروض
          </span>
        );
      case 'offers_received':
        return (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock size={12} /> توجد عروض جديدة
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock size={12} /> قيد التنفيذ
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={12} /> مكتمل
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <XCircle size={12} /> ملغي
          </span>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    setSelectedRequest(null);
  };

  if (selectedRequest) {
    const request = MOCK_REQUESTS.find((r) => r.id === selectedRequest);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-diyar-brown mb-6 transition-colors"
        >
          <ArrowRight size={20} />
          <span className="font-bold">العودة للطلبات</span>
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-wrap gap-4 items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500 font-mono">{request?.id}</span>
                {request && getStatusBadge(request.status)}
              </div>
              <h1 className="text-2xl font-bold text-diyar-dark mb-2">{request?.title}</h1>
              <p className="text-gray-500 text-sm">{request?.date}</p>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-gray-500 text-sm">نوع الخدمة:</span>
              <span className="font-bold text-diyar-dark text-sm">{request?.type}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> تفاصيل الطلب
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">{request?.description}</p>
          </div>
        </div>

        {request?.status === 'offers_received' && (
          <div>
            <h2 className="text-xl font-bold text-diyar-dark mb-6 flex items-center gap-2">
              عروض الأسعار المتاحة
              <span className="bg-diyar-dark text-white text-xs px-2.5 py-1 rounded-full">
                {MOCK_OFFERS.length}
              </span>
            </h2>

            <div className="space-y-4">
              {MOCK_OFFERS.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border text-right border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-diyar-brown/30 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-diyar-dark">{offer.providerName}</h3>
                        <span className="text-xs text-gray-400">{offer.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-4 bg-amber-50 w-fit px-2 py-1 rounded text-xs font-bold text-amber-700">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{offer.rating}</span>
                        <span className="text-amber-600/70 font-normal">
                          ({offer.reviewsCount} تقييم)
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {offer.description}
                      </p>

                      <div className="flex gap-3 mt-auto">
                        <button className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-diyar-brown transition-colors">
                          قبول العرض
                        </button>
                        <button
                          onClick={() =>
                            navigate('/chat', {
                              state: {
                                provider: offer.providerName,
                                title: request?.title,
                                price: offer.price,
                              },
                            })
                          }
                          className="border border-gray-200 bg-white text-gray-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <MessageSquare size={16} /> محادثة
                        </button>
                      </div>
                    </div>

                    <div className="md:w-48 shrink-0 bg-gray-50 rounded-2xl p-4 flex flex-col justify-center items-center border border-gray-100 gap-4 relative overflow-hidden group-hover:bg-amber-50/30 transition-colors">
                      <div className="text-center">
                        <span className="block text-xs text-gray-500 mb-1">السعر المقترح</span>
                        <span className="block text-2xl font-bold text-diyar-dark">
                          {offer.price}
                        </span>
                      </div>
                      <div className="h-px w-full bg-gray-200"></div>
                      <div className="text-center">
                        <span className="block text-xs text-gray-500 mb-1">مدة التنفيذ</span>
                        <span className="block font-bold text-gray-800">{offer.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-2">
            طلبات الخدمات والصيانة
          </h1>
          <p className="text-gray-500">
            تابع طلباتك الخاصة، واطلع على عروض مزودي الخدمة الجاهزة للتنفيذ.
          </p>
        </div>
        <Link
          to="/services"
          className="bg-diyar-brown text-white px-6 py-3 rounded-full font-bold hover:bg-diyar-dark transition-colors flex items-center justify-center gap-2 w-full md:w-auto shrink-0 shadow-sm hover:shadow-md"
        >
          <Plus size={20} /> طلب تنفيذ
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
        {['all', 'pending', 'in_progress', 'completed'].map((tabStr, idx) => {
          const names = ['الكل', 'بانتظار العروض', 'قيد التنفيذ', 'مكتملة'];
          return (
            <button
              key={tabStr}
              onClick={() => setActiveTab(tabStr)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tabStr
                  ? 'bg-diyar-dark text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {names[idx]}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 text-right">
        {MOCK_REQUESTS.map((request) => (
          <div
            key={request.id}
            onClick={() => setSelectedRequest(request.id)}
            className="bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-md hover:border-diyar-brown/30 transition-all cursor-pointer group flex flex-col md:flex-row gap-5 items-start md:items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-amber-50 group-hover:text-diyar-brown transition-colors">
              {request.icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="font-bold text-lg text-diyar-dark group-hover:text-diyar-brown transition-colors">
                  {request.title}
                </h3>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-gray-500 text-sm mb-3">
                <span className="font-mono ml-3">{request.id}</span>
                تم الطلب في {request.date}
              </p>

              {request.offersCount > 0 && request.status === 'offers_received' && (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>تلقيت {request.offersCount} عروض أسعار</span>
                </div>
              )}
              {request.selectedProvider && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    مقدم الخدمة:{' '}
                    <strong className="text-gray-800">{request.selectedProvider}</strong>
                  </span>
                  <span className="text-gray-500">
                    التكلفة: <strong className="text-gray-800">{request.price}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="hidden md:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center text-gray-400 group-hover:bg-diyar-dark group-hover:text-white transition-colors">
              <ArrowLeft
                size={18}
                className="translate-x-0 group-hover:-translate-x-1 transition-transform"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

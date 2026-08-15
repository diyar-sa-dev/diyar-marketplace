import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Star, ShieldCheck, ChevronRight, MessageSquare } from 'lucide-react';

const MOCK_ORDERS = [
  {
    orderId: "DYR-84920",
    date: "12 مايو 2024",
    status: "جاري التوصيل", // Order global status
    subOrders: [
      {
        vendorName: "مفروشات الرقي",
        status: "شُحنت", // 'قيد التجهيز', 'شُحنت', 'تم التوصيل'
        statusStep: 2, // 1, 2, 3
        trackingNumber: "TRK-992138",
        items: [
          { name: "أريكة استرخاء كلاسيكية", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200", isReviewed: false }
        ]
      },
      {
        vendorName: "روائع الخشب",
        status: "قيد التجهيز لدى التاجر",
        statusStep: 1,
        trackingNumber: "-",
        items: [
          { name: "طاولة قهوة خشبية", img: "https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200", isReviewed: false }
        ]
      }
    ]
  },
  {
    orderId: "DYR-77112",
    date: "5 أبريل 2024",
    status: "مكتمل", 
    subOrders: [
      {
        vendorName: "بيت الأناقة",
        status: "تم التوصيل",
        statusStep: 3,
        trackingNumber: "TRK-229102",
        items: [
          { name: "وسادة ديكور مطرزة", img: "https://images.unsplash.com/photo-1584043960100-c831e78ebfd3?auto=format&fit=crop&q=80&w=200", isReviewed: true }
        ]
      }
    ]
  }
];

export default function OrdersPage() {
  const [activeReviewModal, setActiveReviewModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="bg-diyar-dark text-white py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">طلباتي</h1>
          <p className="text-diyar-cream/80 text-sm">تتبع شحناتك، راجع تفاصيل الطلب، وقيّم المنتجات المستلمة.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {MOCK_ORDERS.map((order) => (
          <div key={order.orderId} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
               <div>
                 <span className="text-xs text-gray-500 block mb-1">رقم الطلب</span>
                 <span className="font-bold text-diyar-dark">{order.orderId}</span>
               </div>
               <div>
                 <span className="text-xs text-gray-500 block mb-1">تاريخ الطلب</span>
                 <span className="font-bold text-diyar-dark">{order.date}</span>
               </div>
               <div className="text-left">
                 <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                   order.status === 'مكتمل' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                 }`}>
                   {order.status}
                 </span>
               </div>
            </div>

            {/* Sub-Orders (Split by Vendor) */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2">
                <Package size={16} /> الشحنات مقسمة حسب التاجر
              </h3>

              <div className="space-y-8">
                {order.subOrders.map((subOrder, i) => (
                  <div key={i} className="border border-gray-100 rounded-2xl p-5 relative">
                    <span className="absolute -top-3 right-6 bg-white px-2 font-bold text-diyar-brown text-sm">
                      شحنة {subOrder.vendorName}
                    </span>
                    
                    <div className="mb-6 mt-2">
                      <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-diyar-dark">{subOrder.status}</span>
                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">رقم التتبع: <span dir="ltr" className="font-mono text-gray-700">{subOrder.trackingNumber}</span></span>
                      </div>
                      
                      {/* Tracking Progress Bar */}
                      <div className="relative mt-6 mb-4 px-4">
                        <div className="absolute top-1/2 right-4 left-4 h-1 bg-gray-100 -translate-y-1/2 rounded-full -z-10"></div>
                        <div className="absolute top-1/2 right-4 h-1 bg-green-500 -translate-y-1/2 rounded-full -z-10 transition-all duration-1000" style={{ width: subOrder.statusStep === 1 ? '0%' : subOrder.statusStep === 2 ? '50%' : '100%' }}></div>
                        
                        <div className="flex justify-between px-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${subOrder.statusStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                             <Package size={12} />
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${subOrder.statusStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                             <Truck size={12} />
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${subOrder.statusStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                             <CheckCircle size={12} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 px-2">
                         <span>تجهيز</span>
                         <span className="mr-4">شحن</span>
                         <span>تسليم</span>
                      </div>
                    </div>

                    {/* Items inside this shipment */}
                    <div className="space-y-3 bg-gray-50/50 rounded-xl p-3">
                      {subOrder.items.map((item, j) => (
                        <div key={j} className="flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                           <img 
                             src={item.img} 
                             alt={item.name} 
                             referrerPolicy="no-referrer"
                             className="w-14 h-14 rounded-md object-cover" 
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
                             }}
                           />
                           <div className="flex-1">
                             <h4 className="font-bold text-diyar-dark text-sm">{item.name}</h4>
                           </div>
                           {/* Review Button only visible if Delivered */}
                           {subOrder.statusStep === 3 && (
                              <button 
                                onClick={() => setActiveReviewModal(item.name)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                                  item.isReviewed ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-diyar-cream text-diyar-brown hover:bg-diyar-brown hover:text-white border border-diyar-brown/20'
                                }`}
                                disabled={item.isReviewed}
                              >
                                {item.isReviewed ? 'تم التقييم' : 'قيّم المنتج'}
                              </button>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {activeReviewModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6">
            <h2 className="text-xl font-bold text-diyar-dark mb-2">تقييم تجربة الشراء</h2>
            <p className="text-gray-500 text-xs mb-6 bg-blue-50 p-3 rounded-lg flex gap-2">
              <ShieldCheck size={16} className="text-blue-500 shrink-0" />
               يتم مراجعة التقييمات من قبل الإدارة قبل نشرها للحفاظ على المصداقية.
            </p>

            <h4 className="font-bold mb-4">{activeReviewModal}</h4>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={32} className="text-gray-200 hover:text-yellow-400 cursor-pointer transition-colors" />
              ))}
            </div>

            <textarea 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown resize-none h-24 mb-6"
              placeholder="اكتب ملاحظاتك، كيف كانت الجودة والخدمة؟"
            ></textarea>

            <div className="flex gap-3">
              <button 
                onClick={() => setActiveReviewModal(null)}
                className="flex-1 bg-gray-100 text-diyar-dark font-bold py-3 rounded-xl hover:bg-gray-200 transition"
              >إلغاء</button>
              <button 
                onClick={() => {
                  alert('تم إرسال التقييم للمراجعة');
                  setActiveReviewModal(null);
                }}
                className="flex-1 bg-diyar-brown text-white font-bold py-3 rounded-xl hover:bg-[#A67B5B]/90 transition"
              >تأكيد التقييم</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

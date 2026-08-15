import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Star, MessageSquare } from 'lucide-react';

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'published' | 'pending'>('published');

  const publishedReviews = [
    {
      id: 1,
      productName: "طقم كنب زاوية فاخر",
      productImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400",
      rating: 5,
      date: "10 مايو 2024",
      comment: "جودة ممتازة وتصميم رائع، التوصيل كان سريعاً والتركيب احترافي جداً.",
      likes: 12
    },
    {
      id: 2,
      productName: "طاولة طعام خشب رخام",
      productImage: "https://images.unsplash.com/photo-1560606177-063fb90494f4?auto=format&fit=crop&q=80&w=400",
      rating: 4,
      date: "25 أبريل 2024",
      comment: "الطاولة فخمة جداً، لكن كان هناك تأخير بسيط في التسليم.",
      likes: 3
    }
  ];

  const pendingReviews = [
    {
      id: 3,
      productName: "سرير مزدوج مودرن",
      productImage: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400",
      orderDate: "05 مايو 2024",
    },
    {
      id: 4,
      productName: "خزانة ملابس 6 أبواب",
      productImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400",
      orderDate: "01 مايو 2024",
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition">حسابي</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">تقييماتي ومراجعاتي</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-1">تقييماتي ومراجعاتي</h1>
          <p className="text-gray-500 text-sm">سجل تقييماتك للمنتجات والخدمات التي قمت بتجربتها</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-200/50 p-1 rounded-xl w-max">
          <button 
            onClick={() => setActiveTab('published')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'published' ? 'bg-white text-diyar-dark shadow-sm' : 'text-gray-500 hover:text-diyar-dark'}`}
          >
            التقييمات المنشورة ({publishedReviews.length})
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-diyar-dark shadow-sm' : 'text-gray-500 hover:text-diyar-dark'}`}
          >
            بانتظار التقييم ({pendingReviews.length})
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'published' && (
            publishedReviews.length > 0 ? (
              publishedReviews.map((review) => (
                <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100">
                    <img src={review.productImage} alt={review.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-diyar-dark mb-1">{review.productName}</h3>
                        <div className="flex items-center gap-1 text-yellow-400 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} className={i >= review.rating ? "text-gray-300" : ""} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="bg-blue-50 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center">👍</span>
                        <span>{review.likes} مفيد</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="text-xs font-bold text-gray-500 hover:text-diyar-dark transition-colors">تعديل</button>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">حذف</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-diyar-dark mb-2">لا توجد تقييمات منشورة</h3>
                <p className="text-gray-500 text-sm">قم بتقييم المنتجات التي قمت بشرائها لمساعدة الآخرين.</p>
              </div>
            )
          )}

          {activeTab === 'pending' && (
            pendingReviews.length > 0 ? (
              pendingReviews.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100">
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-diyar-dark text-sm mb-1">{item.productName}</h3>
                      <p className="text-xs text-gray-500">تم الطلب في {item.orderDate}</p>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto bg-white border border-diyar-dark text-diyar-dark px-6 py-2 rounded-xl text-sm font-bold hover:bg-diyar-dark hover:text-white transition-colors shrink-0">
                    تقييم المنتج
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <Star size={32} />
                </div>
                <h3 className="text-lg font-bold text-diyar-dark mb-2">لا توجد منتجات بانتظار التقييم</h3>
                <p className="text-gray-500 text-sm">لقد قمت بتقييم جميع مشترياتك السابقة.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

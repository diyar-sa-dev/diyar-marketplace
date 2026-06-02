import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Truck, Package, CheckCircle, XCircle, X, Download, ArrowRight, Plus } from 'lucide-react';

export default function VendorOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [ordersList, setOrdersList] = useState([
    { id: '#10245', customer: 'أحمد محمد', date: '2024-05-15', total: 1250, status: 'processing', payment: 'paid', items: 2 },
    { id: '#10246', customer: 'سارة خالد', date: '2024-05-15', total: 450, status: 'shipped', payment: 'paid', items: 1 },
    { id: '#10247', customer: 'فهد العبدالله', date: '2024-05-14', total: 3200, status: 'delivered', payment: 'paid', items: 3 },
    { id: '#10248', customer: 'نورة السالم', date: '2024-05-14', total: 850, status: 'pending', payment: 'unpaid', items: 1 },
    { id: '#10249', customer: 'عبدالرحمن الدوسري', date: '2024-05-13', total: 1500, status: 'cancelled', payment: 'refunded', items: 2 },
  ]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newItems, setNewItems] = useState('1');
  const [newStatus, setNewStatus] = useState('pending');
  const [newPayment, setNewPayment] = useState('paid');

  const updateOrderStatus = (orderId: string, status: string) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev: any) => prev ? { ...prev, status } : null);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newTotal.trim()) {
      alert('يرجى ملء كافة الحقول الأساسية');
      return;
    }

    const nextIdNum = Math.floor(Math.random() * 900) + 10250;
    const newOrder = {
      id: `#${nextIdNum}`,
      customer: newCustomer,
      date: new Date().toISOString().split('T')[0],
      total: parseFloat(newTotal) || 0,
      status: newStatus,
      payment: newPayment,
      items: parseInt(newItems) || 1,
    };

    setOrdersList(prev => [newOrder, ...prev]);
    setIsAddModalOpen(false);
    
    // Reset states
    setNewCustomer('');
    setNewTotal('');
    setNewItems('1');
    setNewStatus('pending');
    setNewPayment('paid');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200">بانتظار التأكيد</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200">قيد التحضير</span>;
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-200">تم الشحن</span>;
      case 'delivered': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">تم التسليم</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">ملغي</span>;
      default: return null;
    }
  };

  const getFilteredOrders = () => {
    let orders = ordersList;
    if (activeTab !== 'all') {
      orders = orders.filter(order => order.status === activeTab);
    }
    if (searchTerm) {
      orders = orders.filter(order => order.id.includes(searchTerm) || order.customer.includes(searchTerm));
    }
    return orders;
  };

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 rounded-xl transition">
              <ArrowRight size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-diyar-dark">تفاصيل الطلب {selectedOrder.id}</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedOrder.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
              <Download size={18} />
              تحميل الفاتورة
            </button>
            <div className="relative group/actions">
              <button className="px-4 py-2 text-sm font-bold text-white bg-diyar-brown rounded-xl hover:bg-[#A67B5B] transition flex items-center gap-2 shadow-sm">
                تحديث الحالة
              </button>
              <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10 py-1">
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'processing')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Package size={14}/>قيد التحضير</button>
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Truck size={14}/>تم الشحن</button>
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><CheckCircle size={14}/>تم التسليم</button>
                <div className="border-t border-gray-100 my-1"></div>
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"><XCircle size={14}/>إلغاء الطلب</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-diyar-dark flex items-center gap-2">
                  <Package size={18} className="text-gray-400" />
                  المنتجات المطلوبة ({selectedOrder.items})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[...Array(selectedOrder.items)].map((_, i) => (
                  <div key={i} className="p-6 flex items-center gap-4 hover:bg-gray-50/30 transition-colors">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                      <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=150" alt="Product" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-diyar-dark mb-1">أريكة استرخاء مخملية</h4>
                      <div className="text-sm text-gray-500 mb-2">القسم: الصالونات • اللون: رمادي</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-diyar-brown">{(selectedOrder.total / selectedOrder.items).toFixed(0)} ر.س</span>
                        <span className="text-sm bg-gray-100 px-2.5 py-1 rounded-lg">الكمية: 1</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-left">
                <div className="text-gray-500 mb-1 text-sm">إجمالي المنتجات</div>
                <div className="font-bold text-2xl text-diyar-dark">{selectedOrder.total} ر.س</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-6 flex items-center gap-2">
                <Truck size={18} className="text-gray-400" />
                تتبع مسار الطلب
              </h3>
              <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:right-[11px] before:w-0.5 before:bg-gray-100 w-fit">
                <div className="relative pl-6">
                  <div className={`absolute right-[-14px] top-1 w-4 h-4 rounded-full border-4 border-white ${selectedOrder.status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <h4 className={`font-bold ${selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>تم التسليم</h4>
                  {selectedOrder.status === 'delivered' && <p className="text-xs text-gray-500 mt-1">تم التسليم بنجاح للعميل</p>}
                </div>
                <div className="relative pl-6">
                  <div className={`absolute right-[-14px] top-1 w-4 h-4 rounded-full border-4 border-white ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                  <h4 className={`font-bold ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'text-purple-600' : 'text-gray-400'}`}>تم الشحن</h4>
                  {['shipped', 'delivered'].includes(selectedOrder.status) && <p className="text-xs text-gray-500 mt-1">الطلب مع شركة الشحن (أرامكس - #43422312)</p>}
                </div>
                <div className="relative pl-6">
                  <div className={`absolute right-[-14px] top-1 w-4 h-4 rounded-full border-4 border-white ${['processing', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                  <h4 className={`font-bold ${['processing', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'text-blue-600' : 'text-gray-400'}`}>قيد التحضير</h4>
                  {['processing', 'shipped', 'delivered'].includes(selectedOrder.status) && <p className="text-xs text-gray-500 mt-1">جاري تجهيز وتغليف المنتجات</p>}
                </div>
                <div className="relative pl-6">
                  <div className="absolute right-[-14px] top-1 w-4 h-4 rounded-full border-4 border-white bg-amber-500"></div>
                  <h4 className="font-bold text-amber-600">تم الطلب</h4>
                  <p className="text-xs text-gray-500 mt-1">تم تأكيد الدفع واستلام الطلب ({selectedOrder.date})</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-4">حالة الطلب</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">الحالة الحالية</div>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">حالة الدفع</div>
                  <span className={`text-sm px-3 py-1.5 rounded-lg border font-bold ${selectedOrder.payment === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : selectedOrder.payment === 'refunded' ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {selectedOrder.payment === 'paid' ? 'مدفوع إلكترونياً (فيزا)' : selectedOrder.payment === 'refunded' ? 'مسترد' : 'بانتظار الدفع'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">رقم التأكيد</div>
                  <div className="font-mono bg-gray-50 px-3 py-1.5 rounded-lg font-medium text-gray-700 border border-gray-100 text-sm">
                    TRX-{Math.floor(Math.random() * 1000000)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-4">معلومات العميل</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-diyar-brown/10 text-diyar-brown rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedOrder.customer.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-diyar-dark text-sm">{selectedOrder.customer}</h4>
                    <p className="text-xs text-gray-500">مشترك منذ مارس 2023</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">رقم الجوال</div>
                    <div className="text-sm font-medium text-gray-700" dir="ltr">+966 50 123 4567</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">البريد الإلكتروني</div>
                    <div className="text-sm font-medium text-gray-700">customer@example.com</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
               <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-4">عنوان التوصيل</h3>
               <div className="space-y-2">
                 <div className="text-sm font-bold text-gray-700">المنزل</div>
                 <p className="text-sm text-gray-600 leading-relaxed">
                   المملكة العربية السعودية، الرياض<br/>
                   حي الملقا، شارع الأمير محمد بن سعد<br/>
                   مبنى رقم 45، شقة 12
                 </p>
                 <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                      عرض الموقع على الخريطة
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-gray-150/45">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">إدارة الطلبات</h2>
          <p className="text-gray-500 text-sm mt-1">عرض وتحديث حالات الطلبات الخاصة بمتجرك.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-diyar-brown hover:bg-[#A67B5B] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>إضافة طلب جديد</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-gray-400 font-bold">فرز وتصفية الطلبات النشطة</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث برقم الطلب..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm w-full md:w-64"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              <Filter size={20} />
            </button>
            {isFilterOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-2">
                <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">حالة الدفع</h4>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">مدفوع</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">غير مدفوع</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">مسترد</button>
                <div className="border-t border-gray-100 my-1"></div>
                <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">تاريخ الطلب</h4>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">اليوم</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">هذا الأسبوع</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">هذا الشهر</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Adding structured Order */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-diyar-dark flex items-center gap-2">
                <Plus size={20} className="text-diyar-brown" />
                إضافة طلب جديد للتاجر
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 px-2.5 hover:bg-gray-150 text-gray-450 hover:text-diyar-dark rounded-xl transition font-bold"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">اسم العميل</label>
                <input 
                  type="text" 
                  value={newCustomer} 
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="مثال: محمد أحمد علي"
                  className="w-full text-right px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">إجمالي الطلب (ر.س)</label>
                  <input 
                    type="number" 
                    value={newTotal} 
                    onChange={(e) => setNewTotal(e.target.value)}
                    placeholder="مثال: 1500"
                    className="w-full text-right px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">عدد المنتجات</label>
                  <input 
                    type="number" 
                    value={newItems} 
                    onChange={(e) => setNewItems(e.target.value)}
                    min="1"
                    placeholder="1"
                    className="w-full text-right px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">حالة الطلب</label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-right px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm bg-white"
                  >
                    <option value="pending">بانتظار التأكيد</option>
                    <option value="processing">قيد التحضير</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">حالة الدفع</label>
                  <select 
                    value={newPayment} 
                    onChange={(e) => setNewPayment(e.target.value)}
                    className="w-full text-right px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm bg-white"
                  >
                    <option value="paid">مدفوع</option>
                    <option value="unpaid">غير مدفوع</option>
                    <option value="refunded">مسترد</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-diyar-dark hover:bg-gray-50 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-diyar-brown hover:bg-[#A67B5B] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
                >
                  حفظ الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'بانتظار التأكيد' },
          { id: 'processing', label: 'قيد التحضير' },
          { id: 'shipped', label: 'تم الشحن' },
          { id: 'delivered', label: 'تم التسليم' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-diyar-brown text-diyar-brown' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border md:rounded-2xl border-gray-100 shadow-sm overflow-hidden border-x-0 md:border-x">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">رقم الطلب</th>
                <th className="px-6 py-4 font-bold">العميل</th>
                <th className="px-6 py-4 font-bold">التاريخ</th>
                <th className="px-6 py-4 font-bold">المنتجات</th>
                <th className="px-6 py-4 font-bold">الإجمالي</th>
                <th className="px-6 py-4 font-bold">الدفع</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getFilteredOrders().map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-diyar-dark">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{order.customer}</td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-gray-600">{order.items} عناصر</td>
                  <td className="px-6 py-4 font-bold text-diyar-brown">{order.total} ر.س</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-md ${order.payment === 'paid' ? 'bg-green-50 text-green-600' : order.payment === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                      {order.payment === 'paid' ? 'مدفوع' : order.payment === 'refunded' ? 'مسترد' : 'غير مدفوع'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-diyar-brown transition p-1" title="عرض التفاصيل">
                         <Eye size={18} />
                       </button>
                       <div className="relative group/actions">
                         <button className="text-gray-400 hover:text-blue-500 transition p-1" title="تحديث الحالة">
                           <Edit size={18} />
                         </button>
                         {/* Status Dropdown Mockup */}
                         <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10 py-1">
                           <button onClick={() => updateOrderStatus(order.id, 'processing')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Package size={14}/>قيد التحضير</button>
                           <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Truck size={14}/>تم الشحن</button>
                           <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><CheckCircle size={14}/>تم التسليم</button>
                           <div className="border-t border-gray-100 my-1"></div>
                           <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"><XCircle size={14}/>إلغاء الطلب</button>
                         </div>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {getFilteredOrders().length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد طلبات تطابق معايير البحث
          </div>
        )}
      </div>
    </div>
  );
}

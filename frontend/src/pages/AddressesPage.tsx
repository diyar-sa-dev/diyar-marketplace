import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, Home, Briefcase, Trash2, Edit2, CheckCircle2, X } from 'lucide-react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      title: "المنزل",
      type: "home",
      name: "أحمد محمد",
      phone: "+966 50 123 4567",
      details: "المملكة العربية السعودية، الرياض، حي الياسمين، شارع العليا، مبنى 12، شقة 4",
      isDefault: true
    },
    {
      id: 2,
      title: "العمل",
      type: "work",
      name: "أحمد محمد",
      phone: "+966 50 123 4567",
      details: "المملكة العربية السعودية، الرياض، حي الملقا، طريق الملك فهد، برج الفيصلية، الدور 15",
      isDefault: false
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add'|'edit'>('add');
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    type: "home",
    name: "",
    phone: "",
    details: "",
    isDefault: false
  });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      id: 0,
      title: "",
      type: "home",
      name: "",
      phone: "",
      details: "",
      isDefault: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (address: any) => {
    setModalMode('edit');
    setFormData(address);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newAddress = {
        ...formData,
        id: Date.now(),
        isDefault: addresses.length === 0 ? true : formData.isDefault
      };
      if (newAddress.isDefault && addresses.length > 0) {
        setAddresses(addresses.map(a => ({...a, isDefault: false})).concat(newAddress));
      } else {
        setAddresses([...addresses, newAddress]);
      }
    } else {
      let updatedAddresses = addresses.map(a => a.id === formData.id ? formData : a);
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({...a, isDefault: a.id === formData.id}));
      }
      setAddresses(updatedAddresses);
    }
    closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const setAsDefault = (id: number) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const deleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition">حسابي</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">عناوين الشحن</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-1">عناوين الشحن</h1>
            <p className="text-gray-500 text-sm">إدارة عناوين التوصيل الخاصة بك لتسهيل عملية الطلب</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={20} />
            <span>إضافة عنوان جديد</span>
          </button>
        </div>

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div key={address.id} className={`bg-white rounded-2xl p-5 border-2 transition-all ${address.isDefault ? 'border-diyar-brown shadow-md relative' : 'border-gray-100 hover:border-gray-200'}`}>
                {address.isDefault && (
                  <div className="absolute top-0 right-5 -mt-3 bg-diyar-brown text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} />
                    <span>العنوان الافتراضي</span>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${address.type === 'home' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {address.type === 'home' ? <Home size={24} /> : <Briefcase size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-diyar-dark text-lg">{address.title}</h3>
                      <p className="text-sm text-gray-500">{address.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed mb-3 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                    <span>{address.details}</span>
                  </p>
                  <p className="text-gray-600 text-sm flex items-center gap-2" dir="ltr">
                    <span className="text-right w-full">{address.phone}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button 
                      onClick={() => setAsDefault(address.id)}
                      className="flex-1 bg-gray-50 text-gray-700 font-bold text-sm py-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      تعيين كافتراضي
                    </button>
                  )}
                  <button 
                    onClick={() => openEditModal(address)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-diyar-dark hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  {!address.isDefault && (
                    <button 
                      onClick={() => deleteAddress(address.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <MapPin size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-diyar-dark mb-2">لا يوجد عناوين مضافة</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">قم بإضافة عنوان التوصيل الخاص بك لتسهيل إنهاء الطلبات في المستقبل.</p>
            <button 
              onClick={openAddModal}
              className="bg-diyar-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              <span>إضافة عنوان جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-diyar-dark">
                {modalMode === 'add' ? 'إضافة عنوان جديد' : 'تعديل العنوان'}
              </h2>
              <button 
                onClick={closeModal}
                className="w-10 h-10 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-diyar-dark transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto scrollbar-hide p-5 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-5" id="address-form">
                
                {/* Title and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم العنوان <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="title"
                      required
                      placeholder="مثال: المنزل، العمل"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع العنوان <span className="text-red-500">*</span></label>
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors appearance-none"
                    >
                      <option value="home">منزل</option>
                      <option value="work">عمل</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الاسم المستلم <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <div className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-4 flex items-center justify-center text-gray-600 font-medium text-sm" dir="ltr">
                      +966
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      dir="ltr"
                      placeholder="5X XXX XXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-l-xl py-3 px-4 text-gray-800 text-right focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل العنوان (المدينة، الحي، الشارع) <span className="text-red-500">*</span></label>
                  <textarea 
                    name="details"
                    required
                    rows={3}
                    placeholder="ادخل تفاصيل العنوان بدقة لتسهيل التوصيل..."
                    value={formData.details}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Default */}
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="isDefault" 
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-diyar-dark focus:ring-diyar-dark border-gray-300 accent-diyar-dark cursor-pointer"
                  />
                  <label htmlFor="isDefault" className="text-sm font-bold text-gray-700 cursor-pointer">
                    تعيين كعنوان افتراضي
                  </label>
                </div>

              </form>
            </div>
            
            <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                form="address-form"
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors"
              >
                {modalMode === 'add' ? 'إضافة العنوان' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

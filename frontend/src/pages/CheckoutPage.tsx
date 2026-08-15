import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, CreditCard, ShieldCheck, Truck, Wrench, 
  Tag, ChevronRight, CheckCircle, Package
} from 'lucide-react';

const MOCK_ADDRESSES = [
  { id: 1, title: 'المنزل', address: 'حي الملقا، شارع الأمير محمد بن سعد، الرياض', isDefault: true },
  { id: 2, title: 'العمل', address: 'برج الفيصلية، طريق الملك فهد، الرياض', isDefault: false }
];

const MOCK_CART = [
  {
    vendorId: 'v1',
    vendorName: 'مفروشات الرقي',
    items: [
      { id: '1', name: 'أريكة استرخاء كلاسيكية', price: 1850, quantity: 1, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200', requiresAssembly: true },
      { id: '2', name: 'وسادة ديكور مطرزة', price: 120, quantity: 2, img: 'https://images.unsplash.com/photo-1584043960100-c831e78ebfd3?auto=format&fit=crop&q=80&w=200', requiresAssembly: false }
    ],
    shippingCost: 150,
    assemblyCostPerItem: 75,
    couponCode: '',
    discount: 0
  },
  {
    vendorId: 'v2',
    vendorName: 'روائع الخشب',
    items: [
      { id: '3', name: 'طاولة قهوة خشبية', price: 420, quantity: 1, img: 'https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200', requiresAssembly: true }
    ],
    shippingCost: 50,
    assemblyCostPerItem: 50,
    couponCode: '',
    discount: 0
  }
];

const PAYMENT_METHODS = [
  { id: 'mada', name: 'مدى', logo: '/payment-methods/Mada_Logo.svg', type: 'image' },
  { id: 'visa', name: 'البطاقة الائتمانية', logo: <CreditCard className="w-8 h-8 text-gray-700" />, type: 'icon' },
  { id: 'apple', name: 'Apple Pay', logo: '/payment-methods/Apple_Pay_logo.svg', type: 'image' },
  { id: 'tabby', name: 'تابي', logo: '/payment-methods/tabby-bnpl.svg', type: 'image' }
];

export default function CheckoutPage() {
  const [selectedAddress, setSelectedAddress] = useState(MOCK_ADDRESSES[0].id);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
  const [cart, setCart] = useState(MOCK_CART);
  const [assemblySelections, setAssemblySelections] = useState<Record<string, boolean>>({});
  const [vendorCoupons, setVendorCoupons] = useState<Record<string, string>>({});

  const toggleAssembly = (itemId: string) => {
    setAssemblySelections(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const applyCoupon = (vendorId: string) => {
    // Mock simulation for applying coupon
    if (vendorCoupons[vendorId] === 'DISCOUNT10') {
      const updatedCart = cart.map(v => 
        v.vendorId === vendorId ? { ...v, discount: 50 } : v
      );
      setCart(updatedCart);
      alert('تم تطبيق الكوبون بنجاح!');
    } else {
      alert('كوبون غير صالح');
    }
  };

  // Calculations
  const subtotal = cart.reduce((total, vendor) => 
    total + vendor.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), 0
  );

  const totalShipping = cart.reduce((total, vendor) => total + vendor.shippingCost, 0);
  
  const totalAssembly = cart.reduce((total, vendor) => 
    total + vendor.items.reduce((sum, item) => 
      assemblySelections[item.id] ? sum + vendor.assemblyCostPerItem : sum
    , 0), 0
  );

  const totalDiscount = cart.reduce((total, vendor) => total + vendor.discount, 0);
  const autoOfferDiscount = 100; // Mock auto discount: "خصم المواسم 100 ريال"

  const vat = (subtotal + totalShipping + totalAssembly - totalDiscount - autoOfferDiscount) * 0.15;
  const finalTotal = subtotal + totalShipping + totalAssembly - totalDiscount - autoOfferDiscount + vat;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="bg-white border-b border-gray-100 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-diyar-dark">إتمام الطلب</h1>
          <ShieldCheck className="text-green-500 w-6 h-6" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
        
        {/* Main Checkout Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Address Selection */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
              <MapPin className="text-diyar-brown" /> عنوان التوصيل
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {MOCK_ADDRESSES.map((addr) => (
                <div 
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedAddress === addr.id ? 'border-diyar-brown bg-diyar-brown/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-diyar-dark">{addr.title}</span>
                    {selectedAddress === addr.id && <CheckCircle className="text-diyar-brown w-5 h-5" />}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{addr.address}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 text-diyar-brown text-sm font-bold hover:underline">
              + إضافة عنوان جديد
            </button>
          </div>

          {/* 2. Order Details (Split by Vendor) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-diyar-dark mb-6 flex items-center gap-2">
              <Package className="text-diyar-brown" /> تفاصيل المنتجات والشحن
            </h2>

            <div className="space-y-8">
              {cart.map((vendor) => (
                <div key={vendor.vendorId} className="border border-gray-100 rounded-2xl p-4 md:p-6 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <span className="font-bold text-diyar-dark text-lg px-3 py-1 bg-white rounded-lg shadow-sm">
                      متجر {vendor.vendorName}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Truck size={14} /> تكلفة الشحن: {vendor.shippingCost} ر.س
                    </span>
                  </div>

                  <div className="space-y-4">
                    {vendor.items.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <img 
                          src={item.img} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
                          }}
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-diyar-dark">{item.name}</h4>
                            <span className="font-bold">{item.price * item.quantity} ر.س</span>
                          </div>
                          <div className="text-sm text-gray-500">الكمية: {item.quantity}</div>
                          
                          {/* Assembly Tracking */}
                          {item.requiresAssembly && (
                            <label className="flex items-center gap-2 mt-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100 cursor-pointer w-fit">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown"
                                checked={!!assemblySelections[item.id]}
                                onChange={() => toggleAssembly(item.id)}
                              />
                              <span className="text-xs font-medium text-blue-900 flex items-center gap-1">
                                <Wrench size={12} /> طلب تنفيذ التركيب (+{vendor.assemblyCostPerItem} ر.س)
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor Coupon Context */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                      <Tag size={14} /> كوبون خصم {vendor.vendorName}
                    </label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="أدخل الرمز هنا (مثال: DISCOUNT10)" 
                         className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none"
                         value={vendorCoupons[vendor.vendorId] || ''}
                         onChange={(e) => setVendorCoupons(prev => ({ ...prev, [vendor.vendorId]: e.target.value }))}
                       />
                       <button 
                         onClick={() => applyCoupon(vendor.vendorId)}
                         className="bg-gray-100 hover:bg-gray-200 text-diyar-dark px-4 py-2 rounded-xl text-sm font-bold transition"
                       >
                         تطبيق
                       </button>
                    </div>
                    {vendor.discount > 0 && (
                      <p className="text-xs text-green-600 mt-2 font-bold bg-green-50 px-2 py-1 rounded inline-block">
                        تم خصم {vendor.discount} ر.س لكوبون متجر {vendor.vendorName}!
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Payment Methods */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
              <CreditCard className="text-diyar-brown" /> طريقة الدفع
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[6rem] ${
                    selectedPayment === method.id ? 'border-diyar-brown bg-diyar-brown/5 ring-1 ring-diyar-brown/20' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="h-10 flex items-center justify-center w-full">
                    {method.type === 'image' ? (
                      <div className="relative h-full flex items-center justify-center w-full">
                        <img 
                          src={method.logo as string} 
                          alt={method.name} 
                          className="max-h-full max-w-[90px] object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.payment-fallback');
                            fallback?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback for when the specific SVG fails or is empty/corrupt */}
                        <div className="payment-fallback hidden flex flex-col items-center">
                           {method.id === 'apple' ? (
                             <span className="text-xl font-bold"> Pay</span>
                           ) : (
                             <span className="text-xs text-gray-500 font-medium">{method.name}</span>
                           )}
                        </div>
                      </div>
                    ) : (
                      method.logo
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-diyar-dark text-center leading-snug">{method.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Order Summary Sticky Footer equivalent */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-xl text-diyar-dark mb-6">ملخص الطلب</h3>
            
            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-gray-100">
              <div className="flex justify-between text-gray-500">
                <span>المجموع الفرعي للمنتجات</span>
                <span className="font-medium text-diyar-dark">{subtotal} ر.س</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>تكلفة الشحن (موزعة)</span>
                <span className="font-medium text-diyar-dark">{totalShipping} ر.س</span>
              </div>
              {totalAssembly > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>خدمات التركيب المضافة</span>
                  <span className="font-medium">+{totalAssembly} ر.س</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصومات الكوبونات</span>
                  <span className="font-medium">-{totalDiscount} ر.س</span>
                </div>
              )}
              {autoOfferDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>عروض تلقائية (خصم المواسم)</span>
                  <span className="font-medium">-{autoOfferDiscount} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span className="font-medium text-diyar-dark">{vat.toFixed(2)} ر.س</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="font-bold text-lg text-diyar-dark">الإجمالي</span>
              <div className="text-right">
                <span className="font-bold text-2xl md:text-3xl text-diyar-dark">{finalTotal.toFixed(2)}</span>
                <span className="text-gray-500 font-medium mr-1">ر.س</span>
              </div>
            </div>

            <Link 
              to="/orders" 
              className="w-full bg-diyar-dark text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              تأكيد الدفع والطلب
              <ChevronRight size={20} className="rotate-180" />
            </Link>
            
            <div className="text-center mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
              <ShieldCheck size={14} /> الدفع آمن ومحمي لمعايير ديار
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

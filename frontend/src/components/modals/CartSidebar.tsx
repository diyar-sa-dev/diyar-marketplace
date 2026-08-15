import React from 'react';
import { X, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.tsx';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQty, count, subtotal } = useCart();
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;
  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-full md:w-[400px] bg-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-diyar-dark">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-bold">سلة المشتريات</h2>
            {count > 0 && (
              <span className="bg-diyar-brown text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-diyar-dark"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
              <ShoppingBag size={40} className="mb-4 opacity-40" />
              <p className="font-bold text-diyar-dark mb-1">سلتك فارغة</p>
              <p className="text-sm">أضف منتجات أو خدمات لتظهر هنا.</p>
            </div>
          )}

          {items.map((item) => (
            <div key={item.uid} className="flex gap-4 p-3 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative group">
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${item.type === 'service' ? 'bg-diyar-cream/60 text-diyar-brown' : 'bg-gray-50'}`}>
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400'; }}
                  />
                ) : (
                  <Wrench size={28} />
                )}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="min-w-0">
                    {item.type === 'service' && (
                      <span className="inline-block bg-diyar-brown/10 text-diyar-brown text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">خدمة</span>
                    )}
                    <h3 className="font-bold text-diyar-dark text-sm md:text-base line-clamp-1">{item.name}</h3>
                    {item.vendor && <p className="text-xs text-gray-400 mb-1 truncate">{item.vendor}</p>}
                  </div>
                  <button onClick={() => removeItem(item.uid)} className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>

                {item.attributes && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.attributes}</p>}

                <div className="flex items-center justify-between mt-auto gap-2">
                  <span className="font-bold text-diyar-dark text-sm">{item.priceLabel}</span>

                  {item.type === 'product' ? (
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                      <button onClick={() => updateQty(item.uid, -1)} className="text-gray-500 hover:text-diyar-brown p-0.5"><Minus size={14} /></button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.uid, 1)} className="text-gray-500 hover:text-diyar-brown p-0.5"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium">طلب خدمة</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 pb-safe">
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>المجموع الفرعي</span>
              <span>{fmt(subtotal)} ر.س</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>ضريبة القيمة المضافة (15%)</span>
              <span>{fmt(vat)} ر.س</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-diyar-dark mb-4 md:mb-6">
              <span>الإجمالي</span>
              <span>{fmt(total)} ر.س</span>
            </div>

            <Link
              to="/checkout"
              onClick={onClose}
              className="w-full bg-diyar-dark text-white font-bold py-3.5 md:py-4 rounded-xl shadow-lg shadow-black/10 flex items-center justify-center gap-2 hover:bg-black transition-colors group"
            >
              إتمام الطلب
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="text-center mt-3 text-xs text-gray-400">
              الضرائب والشحن تحسب في خطوة الدفع
            </div>
          </div>
        )}
      </div>
    </>
  );
}

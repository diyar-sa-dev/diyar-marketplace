import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Tag, Check, X, Upload, ArrowRight, Eye, LayoutGrid, List } from 'lucide-react';

export default function VendorProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [customColorText, setCustomColorText] = useState('');

  const [productsList, setProductsList] = useState<any[]>([
    { id: 1, name: 'أريكة استرخاء مخملية', category: 'الصالونات', price: 1250, stock: 15, description: 'أريكة استرخاء مريحة مغطاة بالمخمل الإيطالي الناعم مع أرجل خشبية صلبة مناسبة لغرف الجلوس والضيوف.', width: '220', height: '85', depth: '90', material: 'مخمل إيطالي، خشب زان', warranty: 'سنتين', colors: ['رمادي', 'بيج'] },
    { id: 2, name: 'طاولة طعام خشبية', category: 'غرف الطعام', price: 2400, stock: 5, description: 'طاولة طعام مميزة مصنوعة من الخشب السويدي الطبيعي والمعالج ضد الرطوبة والخدوش تتسع لـ 6 أشخاص.', width: '180', height: '75', depth: '90', material: 'خشب سويدي صلب', warranty: '3 سنوات', colors: ['بني', 'أبيض'] },
    { id: 3, name: 'كرسي مكتب مريح', category: 'المكاتب', price: 450, stock: 0, description: 'كرسي مكتب طبي داعم للفقرات والظهر مع مساند قابلة للتعديل وقاعدة بعجلات مرنة.', width: '65', height: '120', depth: '65', material: 'بلاستيك مقوى، شبك طبي', warranty: 'سنة واحدة', colors: ['أسود', 'أزرق'] },
    { id: 4, name: 'سرير مزدوج للزوجين', category: 'غرف النوم', price: 3200, stock: 8, description: 'سرير مزدوج مصمم بأسلوب عصري حديث، لوح خلفي مبطن بالمخمل الفاخر لتوفير أقصى درجات الفخامة والراحة.', width: '200', height: '140', depth: '200', material: 'خشب سويدي، قماش قطيفه', warranty: '5 سنوات', colors: ['كريمي', 'رمادي'] },
    { id: 5, name: 'طاولة قهوة مستديرة', category: 'الصالونات', price: 350, stock: 24, description: 'طاولة قهوة مستديرة أنيقة وعصرية، سطح زجاجي وأرجل معدنية مذهبة لإضفاء لمسة جمالية وفخمة لمحيط المعيشة.', width: '90', height: '45', depth: '90', material: 'معدن مذهب، زجاج مقسى', warranty: 'سنة واحدة', colors: ['ذهبي', 'أسود'] },
  ]);

  // Form states for adding new product (expanded fields)
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('الصالونات');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodWidth, setProdWidth] = useState('');
  const [prodHeight, setProdHeight] = useState('');
  const [prodDepth, setProdDepth] = useState('');
  const [prodMaterial, setProdMaterial] = useState('');
  const [prodWarranty, setProdWarranty] = useState('سنتين');
  const [prodDesc, setProdDesc] = useState('');
  const [prodColors, setProdColors] = useState<string[]>([]);
  const [prodImgUrl, setProdImgUrl] = useState('');

  const PRESET_COLORS = ['بيج', 'رمادي', 'أبيض', 'كريمي', 'أسود', 'بني', 'ذهبي', 'أزرق', 'أخضر'];

  const handleOpenEditModal = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingProduct(product);
    setProdName(product.name || '');
    setProdCategory(product.category || 'الصالونات');
    setProdPrice(product.price ? String(product.price) : '');
    setProdDiscountPrice(product.oldPrice ? String(product.oldPrice) : '');
    setProdStock(product.stock !== undefined ? String(product.stock) : '10');
    setProdWidth(product.width || '');
    setProdHeight(product.height || '');
    setProdDepth(product.depth || '');
    setProdMaterial(product.material || '');
    setProdWarranty(product.warranty || 'سنتين');
    setProdDesc(product.description || '');
    setProdColors(product.colors || []);
    setIsAddModalOpen(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) {
      alert('يرجى ملء كافة الحقول الأساسية: اسم المنتج والسعر');
      return;
    }

    if (editingProduct) {
      const updatedList = productsList.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            category: prodCategory,
            price: parseFloat(prodPrice),
            oldPrice: prodDiscountPrice ? parseFloat(prodDiscountPrice) : undefined,
            stock: parseInt(prodStock) || 0,
            description: prodDesc || 'لم يتم إدخال وصف لهذا المنتج بعد.',
            width: prodWidth || '—',
            height: prodHeight || '—',
            depth: prodDepth || '—',
            material: prodMaterial || 'خامات متعددة فائقة الجودة',
            warranty: prodWarranty || 'سنتين',
            colors: prodColors.length > 0 ? prodColors : ['متعدد الألوان']
          };
        }
        return p;
      });
      setProductsList(updatedList);
      
      if (selectedProduct && selectedProduct.id === editingProduct.id) {
        setSelectedProduct({
          ...selectedProduct,
          name: prodName,
          category: prodCategory,
          price: parseFloat(prodPrice),
          oldPrice: prodDiscountPrice ? parseFloat(prodDiscountPrice) : undefined,
          stock: parseInt(prodStock) || 0,
          description: prodDesc || 'لم يتم إدخال وصف لهذا المنتج بعد.',
          width: prodWidth || '—',
          height: prodHeight || '—',
          depth: prodDepth || '—',
          material: prodMaterial || 'خامات متعددة فائقة الجودة',
          warranty: prodWarranty || 'سنتين',
          colors: prodColors.length > 0 ? prodColors : ['متعدد الألوان']
        });
      }
    } else {
      const nextId = productsList.length > 0 ? Math.max(...productsList.map(p => p.id)) + 1 : 1;
      const newProduct = {
        id: nextId,
        name: prodName,
        category: prodCategory,
        price: parseFloat(prodPrice),
        oldPrice: prodDiscountPrice ? parseFloat(prodDiscountPrice) : undefined,
        stock: parseInt(prodStock) || 0,
        description: prodDesc || 'لم يتم إدخال وصف لهذا المنتج بعد.',
        width: prodWidth || '—',
        height: prodHeight || '—',
        depth: prodDepth || '—',
        material: prodMaterial || 'خامات متعددة فائقة الجودة',
        warranty: prodWarranty || 'سنتين',
        colors: prodColors.length > 0 ? prodColors : ['متعدد الألوان']
      };
      setProductsList([newProduct, ...productsList]);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);

    // Reset Form fields
    setProdName('');
    setProdCategory('الصالونات');
    setProdPrice('');
    setProdDiscountPrice('');
    setProdStock('10');
    setProdWidth('');
    setProdHeight('');
    setProdDepth('');
    setProdMaterial('');
    setProdWarranty('سنتين');
    setProdDesc('');
    setProdColors([]);
  };

  const handleDeleteProduct = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قائمة منتجات متجرك ومخزونك الخاص بالفضاء؟')) {
      setProductsList(productsList.filter(p => p.id !== id));
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(null);
      }
    }
  };

  const handleToggleAffiliate = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setProductsList(productsList.map(p => {
      if (p.id === id) {
        const nextIsAffiliate = !p.isAffiliate;
        return {
          ...p,
          isAffiliate: nextIsAffiliate,
          commission: nextIsAffiliate ? '10%' : null
        };
      }
      return p;
    }));
  };

  const filteredProducts = productsList.filter(p => p.name.includes(searchTerm));

  if (selectedProduct) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProduct(null)} className="p-2 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 rounded-xl transition">
              <ArrowRight size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-diyar-dark">{selectedProduct.name}</h2>
              <p className="text-sm text-gray-400 mt-1 font-sans">{selectedProduct.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={(e) => handleOpenEditModal(selectedProduct, e)}
               className="px-4 py-2 text-xs font-bold text-diyar-brown bg-amber-50 hover:bg-amber-100/70 border border-amber-200 rounded-xl transition flex items-center gap-2 shadow-sm font-sans cursor-pointer"
             >
               <Edit size={14} />
               تعديل بيانات المنتج
             </button>
             <button 
               onClick={() => handleDeleteProduct(selectedProduct.id)}
               className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-xl hover:bg-red-650 transition flex items-center gap-2 shadow-sm font-sans"
             >
               <Trash2 size={14} />
               حذف المنتج من المعرض
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col md:flex-row gap-6">
                 <div className="w-full md:w-48 h-48 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 text-gray-300">
                   <Tag size={48} />
                 </div>
                 <div className="space-y-4 flex-1 text-right">
                    <div>
                      <h3 className="font-bold text-xl text-diyar-dark mb-2">{selectedProduct.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-right">
                        <span className="text-xs text-gray-400 block mb-1">السعر</span>
                        <span className="font-bold text-diyar-brown text-lg">{selectedProduct.price} ر.س</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-right font-sans">
                        <span className="text-xs text-gray-400 block mb-1">المخزون المتوفر</span>
                        <span className={`font-bold text-lg ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{selectedProduct.stock} قطعة</span>
                      </div>
                    </div>
                 </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-right">
                 <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-3 text-right">المواصفات الفنية المكتملة لعملائك</h3>
                 <div className="space-y-3 font-sans">
                   <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right">
                      <span className="text-gray-400 block font-bold text-sm">أبعاد وحجم المنتج</span>
                      <span className="col-span-2 text-diyar-dark font-medium text-sm">
                        عرض: {selectedProduct.width} سم | عمق: {selectedProduct.depth} سم | ارتفاع: {selectedProduct.height} سم
                      </span>
                   </div>
                   <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right">
                      <span className="text-gray-400 block font-bold text-sm">الألوان المتاحة</span>
                      <span className="col-span-2 text-diyar-dark font-medium text-sm flex gap-1.5 items-center justify-start flex-wrap">
                        {selectedProduct.colors?.map((col: string) => (
                          <span key={col} className="bg-stone-50 px-2 py-0.5 rounded border text-xs text-stone-600">{col}</span>
                        )) || 'متعدد الألوان'}
                      </span>
                   </div>
                   <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right">
                      <span className="text-gray-400 block font-bold text-sm">الخامة الأساسية المعتمدة</span>
                      <span className="col-span-2 text-diyar-dark font-medium text-sm">{selectedProduct.material}</span>
                   </div>
                   <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right">
                      <span className="text-gray-400 block font-bold text-sm">الضمان الفني الممنوح</span>
                      <span className="col-span-2 text-diyar-dark font-medium text-sm bg-amber-50/50 text-diyar-brown px-3 py-0.5 rounded border border-amber-100/55 w-fit">{selectedProduct.warranty}</span>
                   </div>
                 </div>
              </div>
          </div>
          
          <div className="space-y-6 lg:col-span-1 text-right">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-right font-sans">
                 <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-3 text-right">إحصائيات المبيعات</h3>
                 <div className="space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">عدد الطلبات</span>
                      <span className="font-bold text-diyar-dark">0 طلب</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">إجمالي الإيرادات</span>
                      <span className="font-bold text-green-600">0.00 ر.س</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">معدل الإرجاع</span>
                      <span className="font-bold text-diyar-dark">0%</span>
                    </div>
                 </div>
              </div>
              
              <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-6 text-right font-sans space-y-3 animate-in">
                 <h4 className="font-bold text-diyar-dark text-sm">حالة وتحديث المخزون</h4>
                 <p className="text-xs text-gray-500 leading-relaxed font-sans">
                   يمكنك تتبع مبيعات وتوافر هذا المنتج وتحديث شحنته في أي وقت من خلال محرر المخزون السريع.
                 </p>
                 <button 
                   onClick={(e) => handleOpenEditModal(selectedProduct, e)}
                   className="w-full bg-diyar-brown text-white hover:bg-[#A67B5B]/90 font-bold py-2 rounded-xl transition text-xs font-sans shadow-sm cursor-pointer"
                 >
                   تعديل التفاصيل الفنية والكمية
                 </button>
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-right">
          <h2 className="text-2xl font-bold text-diyar-dark">المنتجات والمخزون</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة منتجاتك، تتبع المخزون، وتفعيل التسويق بالعمولة.</p>
        </div>
        
        <div className="flex items-center gap-3 relative flex-wrap justify-end">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-diyar-dark' : 'text-gray-500 hover:text-diyar-dark'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-diyar-dark' : 'text-gray-500 hover:text-diyar-dark'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm w-full md:w-64 text-right"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="relative">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              <Filter size={20} />
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-2 text-right">
                <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">القسم</h4>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">الصالونات</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">غرف النوم</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">المكاتب</button>
                <div className="border-t border-gray-100 my-1"></div>
                <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">حالة المخزون</h4>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">متوفر</button>
                <button className="w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm text-diyar-dark">نفذت الكمية</button>
              </div>
            )}
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="bg-diyar-brown text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition">
            <Plus size={18} />
            إضافة منتج
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border rounded-2xl border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-right">المنتج</th>
                  <th className="px-6 py-4 font-bold text-right">القسم</th>
                  <th className="px-6 py-4 font-bold text-right">السعر</th>
                  <th className="px-6 py-4 font-bold text-right">المخزون</th>
                  <th className="px-6 py-4 font-bold text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-diyar-dark flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <Tag size={16} />
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 font-bold text-diyar-brown">{product.price} ر.س</td>
                    <td className="px-6 py-4">
                      {product.stock > 0 ? (
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                          ({product.stock}) متوفر
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                          نفذت الكمية
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                         <button onClick={() => setSelectedProduct(product)} className="text-gray-400 hover:text-diyar-brown transition p-1" title="عرض التفاصيل">
                           <Eye size={16} />
                         </button>
                         <button onClick={(e) => handleOpenEditModal(product, e)} className="text-gray-400 hover:text-diyar-brown transition p-1" title="تعديل المنتج">
                           <Edit size={16} />
                         </button>
                         <button onClick={(e) => handleDeleteProduct(product.id, e)} className="text-gray-400 hover:text-red-500 transition p-1" title="حذف">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">لا يوجد منتجات تطابق بحثك</div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
             <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
               <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-300 relative group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                 <Tag size={48} />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="bg-white text-diyar-dark px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                     <Eye size={16} />
                     عرض التفاصيل
                   </button>
                 </div>
               </div>
               <div className="p-4 flex-1 flex flex-col text-right">
                 <div className="flex items-start justify-between mb-2 gap-2">
                   <h3 className="font-bold text-diyar-dark line-clamp-2 leading-tight text-right">{product.name}</h3>
                   <span className="font-bold text-diyar-brown shrink-0">{product.price} ر.س</span>
                 </div>
                 <p className="text-sm text-gray-400 mb-4">{product.category}</p>
                 
                 <div className="mt-auto space-y-3 font-sans">
                    
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 text-right">
                        {product.stock > 0 ? (
                           <span className="text-green-650 text-xs font-bold flex items-center gap-1 justify-start"><span className="w-2 h-2 rounded-full bg-green-500"></span>متوفر ({product.stock})</span>
                        ) : (
                           <span className="text-red-600 text-xs font-bold flex items-center gap-1 justify-start"><span className="w-2 h-2 rounded-full bg-red-500"></span>نفذت</span>
                        )}
                      </div>
                      <button onClick={() => setSelectedProduct(product)} className="p-2 text-gray-400 hover:text-diyar-brown hover:bg-amber-50 rounded-lg transition cursor-pointer" title="عرض التفاصيل"><Eye size={18} /></button>
                      <button onClick={(e) => handleOpenEditModal(product, e)} className="p-2 text-gray-400 hover:text-diyar-brown hover:bg-amber-50 rounded-lg transition cursor-pointer" title="تعديل المنتج"><Edit size={18} /></button>
                      <button onClick={(e) => handleDeleteProduct(product.id, e)} className="p-2 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer" title="حذف المنتج"><Trash2 size={18} /></button>
                    </div>
                 </div>
               </div>
             </div>
          ))}
          {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">لا يوجد منتجات تطابق بحثك</div>
          )}
        </div>
      )}

      {/* Add Product Modal (Horizontal Landscape Layout) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="text-right flex-1 select-none pr-1">
                <h3 className="font-bold text-xl text-diyar-dark flex items-center gap-2">
                  <span className="p-2 bg-diyar-brown/10 text-diyar-brown rounded-xl">
                    <Plus size={18} />
                  </span>
                  إضافة منتج وتفاصيله الفنية والمواصفات الكاملة
                </h3>
                <p className="text-gray-400 text-xs mt-0.5 font-sans">تعبئة مواصفات وأبعاد وتسويق المنتج بشكل أفقي منظّم لبيعه على المنصة</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                className="text-gray-400 hover:bg-gray-100 p-2.5 rounded-xl transition font-bold"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form Container */}
            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Right Column: Media, Categories, Colors & Affiliate Marketing (lg:col-span-12 on mobile, lg:col-span-5 on desktop) */}
                <div className="lg:col-span-5 space-y-6 text-right">
                  
                  {/* Media Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">صور المنتج والمعاينة</label>
                    <div className="w-full h-40 border-2 border-dashed border-gray-200 hover:border-diyar-brown/50 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-diyar-brown/5 transition-colors cursor-pointer p-4 group">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-diyar-brown group-hover:scale-115 transition">
                        <Upload size={22} className="mx-auto" />
                      </div>
                      <span className="text-sm font-bold text-diyar-dark mt-3">اسحب أو اضغط لرفع صور المنتج</span>
                      <span className="text-xs text-gray-450 mt-1 font-sans">يدعم JPG, PNG (بحد أقصى 5 صور بدقة عالية)</span>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-4 text-right">
                    <h4 className="text-xs font-bold text-gray-500 pb-2 border-b border-gray-100 text-right">التصنيف وقسم المعيشة</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 pb-1 block text-right">القسم الرئيسي</label>
                      <select 
                        value={prodCategory} 
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm"
                      >
                        <option value="الصالونات">الصالونات والمعيشة</option>
                        <option value="غرف النوم">غرف النوم والأسرة</option>
                        <option value="غرف الطعام">غرف الطعام والمطابخ</option>
                        <option value="المكاتب">المكاتب وبيئات العمل</option>
                        <option value="الديكورات">الديكورات والملحقات الإضافية</option>
                      </select>
                    </div>
                  </div>

                  {/* Colors Presets & Dynamic adding */}
                  <div className="space-y-3 text-right">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block text-right">ألوان المنتج المحددة</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-150 justify-start">
                      {prodColors.length === 0 ? (
                        <span className="text-xs text-gray-400 italic font-sans">لم يتم اختيار أي لون بعد...</span>
                      ) : (
                        prodColors.map(color => (
                          <span
                            key={color}
                            className="bg-diyar-brown text-white pl-2 pr-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                          >
                            {color}
                            <button
                              type="button"
                              onClick={() => setProdColors(prodColors.filter(c => c !== color))}
                              className="hover:bg-white/20 p-0.5 rounded-full transition cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-650 block text-right mb-1">إضافة لون مخصص</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customColorText}
                          onChange={(e) => setCustomColorText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customColorText.trim()) {
                                if (!prodColors.includes(customColorText.trim())) {
                                  setProdColors([...prodColors, customColorText.trim()]);
                                }
                                setCustomColorText('');
                              }
                            }
                          }}
                          placeholder="اكتب اسم اللون ثم اضغط زر الإضافة"
                          className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown text-xs text-right font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customColorText.trim()) {
                              if (!prodColors.includes(customColorText.trim())) {
                                setProdColors([...prodColors, customColorText.trim()]);
                              }
                              setCustomColorText('');
                            }
                          }}
                          className="bg-diyar-brown hover:bg-[#A67B5B]/90 text-white font-bold h-[38px] px-4 rounded-xl leading-none transition text-xs font-sans shrink-0 border border-transparent shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          إضافة لون
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-400 block text-right mt-1">اقتراحات ألوان سريعة:</span>
                      <div className="flex flex-wrap gap-1.5 justify-start">
                        {PRESET_COLORS.filter(col => !prodColors.includes(col)).map(color => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setProdColors([...prodColors, color])}
                            className="bg-white text-gray-600 border border-gray-200 hover:border-diyar-brown text-xs py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 font-medium font-sans cursor-pointer"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              color === 'أبيض' ? 'bg-white border border-gray-300' :
                              color === 'رمادي' ? 'bg-gray-400' :
                              color === 'أسود' ? 'bg-black' :
                              color === 'بيج' ? 'bg-[#F5F5DC] border' :
                              color === 'بني' ? 'bg-[#8B4513]' :
                              color === 'ذهبي' ? 'bg-[#FFD700]' :
                              color === 'أزرق' ? 'bg-blue-600' :
                              color === 'أخضر' ? 'bg-green-600' : 'bg-stone-400'
                            }`} />
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Left Column: Product Specs, Pricing, Dimensions & Description (lg:col-span-7) */}
                <div className="lg:col-span-7 space-y-6 text-right">
                  
                  {/* Basic Details */}
                  <div className="space-y-4 text-right">
                    <div className="space-y-1.5 text-right">
                      <label className="text-sm font-bold text-gray-700 block text-right">اسم المنتج المعروض</label>
                      <input 
                        type="text" 
                        value={prodName} 
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="مثال: أريكة معيشة مخملية مودرن بذراعين" 
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm font-medium text-right"
                        required
                      />
                    </div>

                    {/* Pricing and inventory */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-gray-700 block text-right">سعر البيع الافتراضي (ر.س)</label>
                        <input 
                          type="number" 
                          value={prodPrice} 
                          onChange={(e) => setProdPrice(e.target.value)}
                          placeholder="مثال: 1250" 
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm font-bold text-diyar-brown text-right animate-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-gray-550 block text-right">السعر المقارن/شطب (اختياري)</label>
                        <input 
                          type="number" 
                          value={prodDiscountPrice} 
                          onChange={(e) => setProdDiscountPrice(e.target.value)}
                          placeholder="مثال: 1600" 
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm font-medium text-gray-400 text-right"
                        />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-gray-700 block text-right">كمية المخزون الأولي</label>
                        <input 
                          type="number" 
                          value={prodStock} 
                          onChange={(e) => setProdStock(e.target.value)}
                          placeholder="10" 
                          className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm font-bold text-right"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical Technical specs */}
                  <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-150 space-y-4 text-right">
                    <h4 className="text-xs font-bold text-stone-600 block border-b border-stone-100 pb-2 text-right">تفاصيل المقاسات والأبعاد والضمان الفني (مهم للزبائن)</h4>
                    
                    {/* Dimension specifications */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 text-center font-sans">
                        <label className="text-xs text-stone-500 block mb-1">العرض الكامل (سم)</label>
                        <input 
                          type="text" 
                          value={prodWidth} 
                          onChange={(e) => setProdWidth(e.target.value)}
                          placeholder="مثال: 220" 
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1 text-center font-sans">
                        <label className="text-xs text-stone-500 block mb-1">العمق الإجمالي (سم)</label>
                        <input 
                          type="text" 
                          value={prodDepth} 
                          onChange={(e) => setProdDepth(e.target.value)}
                          placeholder="مثال: 90" 
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none text-xs text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1 text-center font-sans">
                        <label className="text-xs text-stone-500 block mb-1">الارتفاع الكلي (سم)</label>
                        <input 
                          type="text" 
                          value={prodHeight} 
                          onChange={(e) => setProdHeight(e.target.value)}
                          placeholder="مثال: 85" 
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl focus:outline-none text-xs text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Material and Warranty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-right">
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-gray-600 block text-right pb-1">المواد والخامات الأساسية</label>
                        <input 
                          type="text" 
                          value={prodMaterial} 
                          onChange={(e) => setProdMaterial(e.target.value)}
                          placeholder="مثال: خشب زان طبيعي، إسفنج عالي المرونة، قماش بوكليه" 
                          className="w-full p-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-diyar-brown text-xs text-right font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-gray-600 block text-right pb-1">مدة الضمان للهيكل والمنتج</label>
                        <select 
                          value={prodWarranty} 
                          onChange={(e) => setProdWarranty(e.target.value)}
                          className="w-full p-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-diyar-brown text-xs font-bold text-stone-700"
                        >
                          <option value="بدون ضمان">لا يوجد ضمان</option>
                          <option value="سنة واحدة">ضمان سنة كاملة ضد العيوب المصنعية</option>
                          <option value="سنتين">سنتين (الضمان الافتراضي القياسي)</option>
                          <option value="3 سنوات">3 سنوات ضمان بلاتيني للمقاعد والصالونات</option>
                          <option value="5 سنوات">5 سنوات ضمان ذهبي للأثاث الفخم</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Complete Description */}
                  <div className="space-y-1.5 text-right font-sans">
                    <label className="text-sm font-bold text-gray-700 block text-right">شرح ووصف تفصيلي كامل للمنتج</label>
                    <textarea 
                      rows={4} 
                      value={prodDesc} 
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="اكتب وصفاً مفصلاً للمنتج ومزاياه، طرق العناية ونوع القماش وعوامل القوة لجذب الزبائن للتوصية بالمنتج..." 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-sm text-right"
                    />
                  </div>

                </div>

              </div>

              {/* Form Footer */}
              <div className="mt-8 pt-6 border-t border-gray-150 flex items-center justify-end gap-3 text-right">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-diyar-dark hover:bg-gray-50 transition text-sm"
                >
                  إلغاء وتراجع
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 rounded-xl font-bold bg-diyar-brown hover:bg-[#A67B5B]/90 text-white hover:scale-[1.01] active:scale-[0.99] transition shadow-md text-sm cursor-pointer font-sans"
                >
                  تأكيد وحفظ ونشر المنتج
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

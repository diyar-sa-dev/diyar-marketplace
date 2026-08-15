import React, { useState } from 'react';
import { Bookmark, Star, Store, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.tsx';

const ProductCard: React.FC<{product: any; layout?: 'grid' | 'list'}> = ({product, layout = 'grid'}) => {
  const [isSaved, setIsSaved] = useState(false);
  const { addItem } = useCart();
  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ type: 'product', name: product.name, vendor: product.vendor || product.store, price: product.price, img: product.img });
  };

  if (layout === 'list') {
    return (
      <Link to={`/product/${product?.id || '1'}`} className="block w-full group">
        <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-md bg-white relative flex flex-row h-32 sm:h-36 md:h-40">
          <div className="relative w-1/3 min-w-[110px] sm:min-w-[130px] md:min-w-[150px] h-full overflow-hidden shrink-0">
            <img 
              src={product.img} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-700 group-hover:scale-105" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
              }}
            />
            <Bookmark 
              className={`absolute top-2 right-2 cursor-pointer bg-white/80 backdrop-blur-md p-1.5 rounded-full w-7 h-7 shadow-sm transition-all z-10 ${isSaved ? 'text-diyar-brown fill-diyar-brown' : 'text-gray-500 hover:text-diyar-brown hover:scale-110'}`} 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                setIsSaved(!isSaved);
              }} 
            />
            <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 text-[9px] font-bold rounded shadow-sm z-10">تخفيض 20%</span>
          </div>
          
          <div className="flex flex-col flex-grow p-2.5 sm:p-4 justify-between h-full">
            <div>
              <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-xs mb-0.5 font-medium">
                <Store size={11} className="text-diyar-brown" />
                <span>{product.vendor || product.store}</span>
              </div>
              
              <h3 className="font-bold text-xs sm:text-base mb-1 line-clamp-1 sm:line-clamp-2 text-diyar-dark leading-snug">{product.name}</h3>
              
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-1">
                <div className="flex gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={9} fill={i < 4 ? "currentColor" : "none"} strokeWidth={i < 4 ? 0 : 2} />)}
                  <span className="text-gray-400 text-[9px] mr-1">({product.reviews || 24})</span>
                </div>
                <div className="flex items-center gap-1 text-diyar-brown text-[8px] sm:text-[9px] bg-diyar-cream/60 px-1.5 py-0.5 rounded-lg font-medium">
                   <Award size={9} />
                   <span>+50 نقطة</span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-sm sm:text-lg text-diyar-dark">{product.price} <span className="text-xs font-medium text-gray-400">ر.س</span></span>
              {(product.oldPrice || product.originalPrice) && (
                <span className="text-gray-400 line-through text-[9px] sm:text-xs">{product.oldPrice || product.originalPrice} ر.س</span>
              )}
            </div>
            
            <div className="flex justify-end mt-1">
              <button 
                className="bg-gray-50 text-diyar-dark border border-gray-200 rounded-lg sm:rounded-lg py-1 px-3 sm:py-1.5 sm:px-5 font-bold text-[10px] sm:text-xs transition-all hover:bg-diyar-brown hover:text-white hover:border-diyar-dark flex items-center justify-center gap-1 z-10 relative"
                onClick={addToCart}
              >
                أضف للسلة
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product?.id || '1'}`} className="block h-full group">
      <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white relative flex flex-col h-full">
        <div className="relative mb-2 aspect-[4/3] md:h-40 overflow-hidden">
          <img 
            src={product.img} 
            alt={product.name} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
            }}
          />
          <Bookmark 
            className={`absolute top-2 right-2 cursor-pointer bg-white/80 backdrop-blur-md p-1.5 rounded-full w-7 h-7 shadow-sm transition-all z-10 ${isSaved ? 'text-diyar-brown fill-diyar-brown' : 'text-gray-500 hover:text-diyar-brown hover:scale-110'}`} 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              setIsSaved(!isSaved);
            }} 
          />
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 text-[9px] font-bold rounded shadow-sm z-10">تخفيض 20%</span>
        </div>
        
        <div className="flex flex-col flex-grow px-3.5 pb-3.5">
          <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 font-medium">
            <Store size={12} className="text-diyar-brown shrink-0" />
            <span className="truncate">{product.vendor || product.store}</span>
          </div>
          
          <h3 className="font-bold text-sm md:text-base mb-1.5 line-clamp-2 text-diyar-dark leading-snug">{product.name}</h3>
          
          <div className="flex flex-wrap items-center justify-between gap-y-1 mb-2 mt-auto">
            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < 4 ? "currentColor" : "none"} strokeWidth={i < 4 ? 0 : 2} />)}
              <span className="text-gray-400 text-[9px] mr-1 mt-0.5">({product.reviews || 24})</span>
            </div>
            <div className="flex items-center gap-1 text-diyar-brown text-[9px] bg-diyar-cream/60 px-1.5 py-0.5 rounded-lg font-medium">
               <Award size={10} />
               <span>+50 نقطة</span>
            </div>
          </div>

          <div className="flex justify-start items-center gap-2 mb-3">
            <span className="font-bold text-lg text-diyar-dark">{product.price} <span className="text-xs font-medium text-gray-400">ر.س</span></span>
            {(product.oldPrice || product.originalPrice) && (
              <span className="text-gray-400 line-through text-[10px]">{product.oldPrice || product.originalPrice} ر.س</span>
            )}
          </div>
          <button 
            className="w-full bg-gray-50 text-diyar-dark border border-gray-200 rounded-lg py-1.5 font-bold text-xs transition-all group-hover:bg-diyar-brown group-hover:text-white group-hover:border-diyar-dark flex items-center justify-center gap-1.5 mt-auto z-10 relative"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            أضف للسلة
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;

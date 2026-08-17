import React, { useState } from 'react';
import { Bookmark, Star, Store, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';

const ServiceCard: React.FC<{ service: any; layout?: 'grid' | 'list' }> = ({
  service,
  layout = 'grid',
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useLocale();
  const { toast } = useToast();

  const notifyServicesUnavailable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(t('cart.servicesUnavailable'));
  };

  if (layout === 'list') {
    return (
      <Link to={`/service/${service?.id || '1'}`} className="block w-full group">
        <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-md bg-white relative flex flex-row h-32 sm:h-36 md:h-40">
          <div className="relative w-1/3 min-w-[110px] sm:min-w-[130px] md:min-w-[150px] h-full overflow-hidden shrink-0">
            <img
              src={service.img}
              alt={service.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';
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
          </div>

          <div className="flex flex-col flex-grow p-2.5 sm:p-4 justify-between h-full font-sans">
            <div>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-xs font-medium">
                  <Store size={11} className="text-diyar-brown" />
                  <span>{service.vendor}</span>
                </div>
                <div className="flex gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={9}
                      fill={i < Math.floor(service.rating || 4) ? 'currentColor' : 'none'}
                      strokeWidth={i < Math.floor(service.rating || 4) ? 0 : 2}
                    />
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-xs sm:text-base mb-1 line-clamp-1 sm:line-clamp-2 text-diyar-dark leading-snug">
                {service.name}
              </h3>

              <div className="flex items-center gap-2 mb-1 text-[9px] sm:text-xs text-gray-500">
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-medium">
                  <CalendarClock size={10} /> {service.type || 'تحديد موعد'}
                </div>
              </div>
            </div>

            <div className="flex justify-start items-center gap-1 mb-1">
              <span className="text-[10px] sm:text-xs text-gray-400">السعر التقريبى:</span>
              <span className="font-bold text-sm sm:text-lg text-diyar-dark">
                {service.price} <span className="text-xs font-medium text-gray-400">ر.س</span>
              </span>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-diyar-brown text-white rounded-lg sm:rounded-lg py-1 px-3 sm:py-1.5 sm:px-5 font-bold text-[10px] sm:text-xs transition-all hover:bg-orange-700 flex items-center justify-center gap-1 z-10 relative"
                onClick={notifyServicesUnavailable}
              >
                طلب تنفيذ
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/service/${service?.id || '1'}`} className="block h-full group">
      <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white relative flex flex-col h-full">
        <div className="relative mb-2 aspect-[4/3] md:h-40 overflow-hidden">
          <img
            src={service.img}
            alt={service.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';
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
        </div>

        <div className="flex flex-col flex-grow px-3.5 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium min-w-0">
              <Store size={12} className="text-diyar-brown shrink-0" />
              <span className="truncate">{service.vendor}</span>
            </div>
            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  fill={i < Math.floor(service.rating || 4) ? 'currentColor' : 'none'}
                  strokeWidth={i < Math.floor(service.rating || 4) ? 0 : 2}
                />
              ))}
            </div>
          </div>

          <h3 className="font-bold text-sm md:text-base mb-1.5 line-clamp-2 text-diyar-dark leading-snug">
            {service.name}
          </h3>

          <div className="flex items-center gap-2 mb-2 mt-auto text-[10px] text-gray-500">
            <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              <CalendarClock size={10} /> {service.type || 'تحديد موعد'}
            </div>
          </div>

          <div className="flex justify-start items-center gap-1 mb-3 mt-1">
            <span className="text-xs text-gray-500 ml-1">السعر التقريبي:</span>
            <span className="font-bold text-base text-diyar-dark">
              {service.price} <span className="text-xs font-medium text-gray-400">ر.س</span>
            </span>
          </div>
          <button
            className="w-full bg-diyar-brown text-white rounded-lg py-1.5 font-bold text-xs transition-colors hover:bg-orange-700 flex items-center justify-center gap-1.5 mt-auto z-10 relative"
            onClick={notifyServicesUnavailable}
          >
            طلب تنفيذ
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;

import { Sparkles, RefreshCw } from 'lucide-react';
import type { ActiveStickerItem } from './sidebarMenuConstants.ts';

type RoomBackground = {
  id: string;
  name: string;
  img: string;
};

type SidebarAiStudioCanvasProps = {
  selectedBg: RoomBackground;
  activeItems: ActiveStickerItem[];
  selectedStickerIndex: number | null;
  setActiveItems: (items: ActiveStickerItem[]) => void;
  setSelectedStickerIndex: (index: number | null) => void;
  updateStickerItem: (index: number, fields: Partial<ActiveStickerItem>) => void;
  removeStickerItem: (index: number) => void;
};

export function SidebarAiStudioCanvas({
  selectedBg,
  activeItems,
  selectedStickerIndex,
  setActiveItems,
  setSelectedStickerIndex,
  updateStickerItem,
  removeStickerItem,
}: SidebarAiStudioCanvasProps) {
  return (
    <div className="flex-1 relative bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => setActiveItems([])}
          className="bg-black/60 text-white hover:bg-black p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur transition border border-white/10"
        >
          <RefreshCw size={12} /> إفراغ الغرفة
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20 text-center pointer-events-none">
        <span className="bg-[#132624]/90 text-diyar-cream text-[10px] md:text-xs font-bold py-1.5 px-3.5 rounded-full shadow-lg border border-diyar-brown/30">
          اسحب القطع، كبّرها أو دوّرها لترتيب غرفتك بسهولة
        </span>
      </div>

      {activeItems.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-diyar-cream mb-3">
            <Sparkles size={22} />
          </div>
          <p className="text-white/90 text-sm font-bold mb-1">ابدأ بتأثيث غرفتك</p>
          <p className="text-white/50 text-xs max-w-55 leading-relaxed">
            اختر طابع الغرفة، ثم اضغط على أي قطعة أثاث من القائمة لإضافتها هنا.
          </p>
        </div>
      )}

      <div className="relative w-full aspect-4/3 max-w-2xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5 select-none">
        <img
          src={selectedBg.img}
          alt="Room background"
          className="w-full h-full object-cover opacity-85 transition-all duration-300 pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {activeItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute cursor-grab active:cursor-grabbing border ${
              selectedStickerIndex === index
                ? 'border-yellow-400 bg-black/20 ring-2 ring-yellow-400/50'
                : 'border-transparent'
            } rounded-xl p-1 transition-all duration-75`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.scale * 120}px`,
              transform: `rotate(${item.rotation}deg)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStickerIndex(index);
            }}
          >
            <img
              src={item.img}
              alt={item.name}
              className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] pointer-events-none rounded-lg"
              referrerPolicy="no-referrer"
            />

            {selectedStickerIndex === index && (
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-white rounded-md px-2 py-0.5 flex items-center gap-2 text-[9px] font-bold pointer-events-auto border border-white/10 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() =>
                    updateStickerItem(index, { scale: Math.max(0.6, item.scale - 0.15) })
                  }
                  className="hover:text-yellow-400 font-bold px-1"
                  title="تصغير"
                >
                  -
                </button>
                <span>الحجم</span>
                <button
                  onClick={() =>
                    updateStickerItem(index, { scale: Math.min(1.8, item.scale + 0.15) })
                  }
                  className="hover:text-yellow-400 font-bold px-1"
                  title="تكبير"
                >
                  +
                </button>
                <span className="w-px h-2.5 bg-white/20"></span>
                <button
                  onClick={() => updateStickerItem(index, { rotation: item.rotation + 45 })}
                  className="hover:text-yellow-400 px-1"
                  title="تدوير"
                >
                  ↻
                </button>
                <span className="w-px h-2.5 bg-white/20"></span>
                <button
                  onClick={() => removeStickerItem(index)}
                  className="text-red-400 hover:text-red-500 font-bold px-1"
                  title="حذف"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import {
  ROOM_BACKGROUNDS,
  STICKERS,
  type ActiveStickerItem,
  type StickerDefinition,
} from './sidebarMenuConstants.ts';
import { SidebarAiStudioCanvas } from './SidebarAiStudioCanvas.tsx';

type SidebarAiStudioModalProps = {
  onClose: () => void;
};

export function SidebarAiStudioModal({ onClose }: SidebarAiStudioModalProps) {
  const [selectedBg, setSelectedBg] = useState(ROOM_BACKGROUNDS[0]);
  const [activeItems, setActiveItems] = useState<ActiveStickerItem[]>([]);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);

  const addStickerToRoom = (sticker: StickerDefinition) => {
    const newItem: ActiveStickerItem = {
      id: `${sticker.id}-${Date.now()}`,
      stickerId: sticker.id,
      x: 100 + activeItems.length * 15,
      y: 120 + activeItems.length * 15,
      scale: 1,
      rotation: 0,
      img: sticker.img,
      name: sticker.name,
    };
    setActiveItems([...activeItems, newItem]);
    setSelectedStickerIndex(activeItems.length);
  };

  const updateStickerItem = (index: number, fields: Partial<ActiveStickerItem>) => {
    const next = [...activeItems];
    next[index] = { ...next[index], ...fields };
    setActiveItems(next);
  };

  const removeStickerItem = (index: number) => {
    const next = activeItems.filter((_, i) => i !== index);
    setActiveItems(next);
    setSelectedStickerIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-100 flex items-center justify-center p-2 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1c] text-[#fbfbf9] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-diyar-brown rounded-lg flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm">مصمم الغرف التفاعلي</h3>
              <p className="text-[10px] text-gray-400 font-semibold">
                تخيّل مكانك، ورتّب قطع أثاث ديار كيفما تشاء
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-white/5 bg-[#121212]">
          <SidebarAiStudioCanvas
            selectedBg={selectedBg}
            activeItems={activeItems}
            selectedStickerIndex={selectedStickerIndex}
            setActiveItems={setActiveItems}
            setSelectedStickerIndex={setSelectedStickerIndex}
            updateStickerItem={updateStickerItem}
            removeStickerItem={removeStickerItem}
          />

          <div className="w-full lg:w-80 shrink-0 p-5 space-y-6 flex flex-col overflow-y-auto max-h-[40vh] lg:max-h-none">
            <div>
              <h4 className="text-xs font-bold text-gray-300 mb-2.5">
                1. حدد طابع الغرفة (المساحة)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setSelectedBg(bg);
                      setSelectedStickerIndex(null);
                    }}
                    className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all p-0 truncate ${selectedBg.id === bg.id ? 'border-diyar-brown' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img
                      src={bg.img}
                      alt={bg.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-1">
                      <span className="text-[10px] font-bold text-white block leading-snug">
                        {bg.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-xs font-bold text-gray-300 mb-2.5">
                2. اضغط على قطعة الأثاث لتجربتها
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {STICKERS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addStickerToRoom(item)}
                    className="bg-[#242424] hover:bg-zinc-800 rounded-2xl p-2 text-right border border-white/5 hover:border-white/15 transition-all text-xs flex gap-2 items-center"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-bold block truncate text-[11px]">{item.name}</span>
                      <span className="text-[9px] text-diyar-brown block font-semibold">
                        بأبعاد دقيقة
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {activeItems.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <h4 className="text-[11px] font-bold text-gray-400 mb-2">3. توجيه الأثاث النشط</h4>
                <div className="flex flex-col gap-2">
                  {activeItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-[11px] transition-colors ${selectedStickerIndex === idx ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'bg-black/30 text-gray-300'}`}
                      onClick={() => setSelectedStickerIndex(idx)}
                    >
                      <span className="truncate">
                        {item.name} #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStickerItem(idx, { x: Math.max(0, item.x - 5) });
                          }}
                          className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                          title="يسار"
                        >
                          ←
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStickerItem(idx, { y: Math.max(0, item.y - 5) });
                          }}
                          className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                          title="أعلى"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStickerItem(idx, { y: Math.min(100, item.y + 5) });
                          }}
                          className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                          title="أسفل"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStickerItem(idx, { x: Math.min(100, item.x + 5) });
                          }}
                          className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                          title="يمين"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

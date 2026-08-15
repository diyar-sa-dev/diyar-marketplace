import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, UploadCloud, Image as ImageIcon, Search } from 'lucide-react';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleSearchClick = () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    // Simulate analyzing the image
    setTimeout(() => {
      setIsAnalyzing(false);
      onClose();
      // Pass a special flag or navigate to search with a visual search query parameter
      navigate('/search?q=visual_search_results');
    }, 2000);
  };

  const resetSelection = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-diyar-dark flex items-center gap-2">
            <Camera className="text-diyar-brown" size={24} />
            البحث بالصورة
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-diyar-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedImage ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleImageSelect}
              />
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} className="text-diyar-brown" />
              </div>
              <h3 className="font-bold text-lg text-diyar-dark mb-2">اسحب الصورة هنا أو اضغط للرفع</h3>
              <p className="text-sm text-gray-500">يدعم صيغ JPG, PNG, WEBP</p>
              
              <div className="mt-8 flex items-center gap-4 text-xs font-bold text-gray-400 w-full" dir="ltr">
                <div className="h-px bg-gray-200 flex-1"></div>
                OR
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <button 
                className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-diyar-dark font-bold hover:border-diyar-brown hover:text-diyar-brown transition-colors w-full justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Camera size={18} />
                <span>التقاط صورة</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden bg-black mb-6 max-h-[300px]">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="w-full h-full object-contain"
                />
                {!isAnalyzing && (
                  <button 
                    onClick={resetSelection}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-diyar-dark/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="font-bold">جاري تحليل الصورة والبحث...</p>
                    <p className="text-sm text-white/70 mt-1">يتم الآن البحث عن منتجات مشابهة</p>
                  </div>
                )}
              </div>

              {!isAnalyzing && (
                <button 
                  onClick={handleSearchClick}
                  className="w-full bg-diyar-dark text-white rounded-xl py-3.5 font-bold text-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  <Search size={20} />
                  البحث عن منتجات مشابهة
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

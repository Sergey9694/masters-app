"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface TaskImageGalleryProps {
  images: string[];
}

export function TaskImageGallery({ images }: TaskImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const close = useCallback(() => {
    setSelectedIndex(null);
    setIsZoomed(false);
  }, []);

  const toggleZoom = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsZoomed(prev => !prev);
  }, []);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setSelectedIndex(prev => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsZoomed(false);
    setSelectedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && !isZoomed) next();
      if (e.key === "ArrowLeft" && !isZoomed) prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, isZoomed, close, next, prev]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 no-scrollbar scroll-smooth">
        {images.map((url, i) => (
          <motion.div
            key={url}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedIndex(i)}
            className="relative h-24 w-24 rounded-[20px] border border-white/10 flex-shrink-0 cursor-pointer overflow-hidden shadow-lg group bg-black/20"
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 touch-none overflow-hidden"
            onClick={close}
          >
            {/* Close Button UI */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-safe+6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white z-[110] backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Navigation Buttons - Hidden when zoomed */}
            {!isZoomed && images.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white disabled:opacity-0 z-[110] backdrop-blur-sm border border-white/5"
                  disabled={selectedIndex === 0}
                  onClick={prev}
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white disabled:opacity-0 z-[110] backdrop-blur-sm border border-white/5"
                  disabled={selectedIndex === images.length - 1}
                  onClick={next}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )}

            {/* Viewport for dragging and swiping */}
            <motion.div 
               className="w-full h-full flex items-center justify-center"
               drag={isZoomed ? "xy" : "y"}
               dragConstraints={isZoomed ? false : { top: 0, bottom: 0 }}
               dragElastic={isZoomed ? 0.1 : 0.6}
               onDragEnd={(_, info) => {
                 if (!isZoomed && Math.abs(info.offset.y) > 100) {
                   close();
                 }
               }}
            >
              <motion.img
                key={selectedIndex}
                src={images[selectedIndex]}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isZoomed ? 2.5 : 1, 
                  opacity: 1,
                  cursor: isZoomed ? "zoom-out" : "zoom-in"
                }}
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                onDoubleClick={toggleZoom}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-[95vw] object-contain shadow-2xl select-none"
                style={{
                  touchAction: "none",
                  willChange: "transform"
                }}
              />
            </motion.div>

            {/* Footer Pagination */}
            {!isZoomed && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[110]" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                        {selectedIndex + 1} / {images.length}
                    </p>
                    {images.length > 1 && (
                    <div className="flex gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5">
                        {images.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ 
                                width: i === selectedIndex ? 16 : 4,
                                backgroundColor: i === selectedIndex ? "#22d3ee" : "rgba(255, 255, 255, 0.2)"
                            }}
                            className="h-1 rounded-full"
                        />
                        ))}
                    </div>
                    )}
                </div>
            )}

            {/* Hint */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute bottom-6 w-full text-center text-[8px] font-bold uppercase tracking-[0.3em] text-white pointer-events-none"
            >
              {isZoomed ? "Перетаскивайте для осмотра • Double tap для уменьшения" : "Swipe вниз для закрытия • Double tap для увеличения"}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

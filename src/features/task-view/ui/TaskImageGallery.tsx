"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useGesture } from "@use-gesture/react";

interface TaskImageGalleryProps {
  images: string[];
}

export function TaskImageGallery({ images }: TaskImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Motion values for pinch-to-zoom and pan
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs
  const springScale = useSpring(scale, { damping: 25, stiffness: 200 });
  const springX = useSpring(x, { damping: 25, stiffness: 200 });
  const springY = useSpring(y, { damping: 25, stiffness: 200 });

  const resetTransform = useCallback(() => {
    scale.set(1);
    x.set(0);
    y.set(0);
  }, [scale, x, y]);

  const close = useCallback(() => {
    setSelectedIndex(null);
    resetTransform();
  }, [resetTransform]);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    resetTransform();
    setSelectedIndex(prev => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length, resetTransform]);

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    resetTransform();
    setSelectedIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, [resetTransform]);

  // Gesture handling
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bind = useGesture(
    {
      onPinch: ({ offset: [d], memo }) => {
        // d is the distance, we map it to scale. Default scale starts at 1.
        const nextScale = Math.max(1, d);
        scale.set(nextScale);
        return memo;
      },
      onDrag: ({ offset: [dx, dy], pinching, delta: [ddx, ddy], last }) => {
        if (pinching) return;
        
        const currentScale = scale.get();
        
        if (currentScale > 1.05) {
          // Panning when zoomed
          x.set(dx);
          y.set(dy);
        } else {
          // Swipe to dismiss or just let it be
          // Only handle Y drag for dismissal when not zoomed
          if (Math.abs(ddy) > Math.abs(ddx)) {
             y.set(dy);
             if (last && Math.abs(dy) > 150) {
               close();
             } else if (last) {
               y.set(0);
             }
          }
        }
      },
    },
    {
      target: containerRef,
      drag: { 
          from: () => [x.get(), y.get()],
          filterTaps: true,
      },
      pinch: { 
          from: () => [scale.get(), 0],
          scaleBounds: { min: 1, max: 4 },
          modifierKey: null,
      },
    }
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && scale.get() <= 1.1) next();
      if (e.key === "ArrowLeft" && scale.get() <= 1.1) prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, close, next, prev, scale]);

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
          >
            {/* Close Button UI */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-safe+6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white z-[120] backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
              onClick={close}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Navigation Buttons - Hidden when zoomed */}
            <AnimatePresence>
              {scale.get() <= 1.1 && images.length > 1 && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white disabled:opacity-0 z-[110] backdrop-blur-sm border border-white/5"
                    disabled={selectedIndex === 0}
                    onClick={prev}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white disabled:opacity-0 z-[110] backdrop-blur-sm border border-white/5"
                    disabled={selectedIndex === images.length - 1}
                    onClick={next}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Viewport for Gestures */}
            <div 
               ref={containerRef}
               className="w-full h-full flex items-center justify-center relative touch-none"
               style={{ perspective: 1000 }}
            >
              <motion.img
                key={selectedIndex}
                src={images[selectedIndex]}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ 
                   scale: springScale,
                   x: springX,
                   y: springY,
                   touchAction: 'none'
                }}
                className="max-h-[85vh] max-w-[95vw] object-contain shadow-2xl select-none pointer-events-none"
              />
            </div>

            {/* Pagination & Hint */}
            <AnimatePresence>
                {scale.get() <= 1.1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[110]"
                    >
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
                        <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.3em] text-white/30 text-center">
                            Щипок для зума • Swipe вниз для закрытия
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

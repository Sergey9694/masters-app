"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface OrderGalleryLightProps {
  images: string[];
  title: string;
}

/**
 * Светлая галерея фото заказа (Фаза 5.5).
 * Thumbnails-сетка + нативный lightbox.
 */
export function OrderGalleryLight({ images, title }: OrderGalleryLightProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const close = useCallback(() => setSelected(null), []);
  const next = useCallback(
    () => setSelected((i) => (i !== null && i < images.length - 1 ? i + 1 : i)),
    [images.length]
  );
  const prev = useCallback(
    () => setSelected((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, close, next, prev]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelected(i)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted transition-transform hover:-translate-y-0.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${title} фото ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                disabled={selected === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                aria-label="Предыдущее"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                disabled={selected === images.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                aria-label="Следующее"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[selected]}
            alt={`${title} фото ${selected + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[95vw] object-contain"
          />

          {images.length > 1 && (
            <span className="absolute bottom-6 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {selected + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}

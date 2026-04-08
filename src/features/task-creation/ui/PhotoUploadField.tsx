"use client";

import { useRef } from "react";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { convertHeicFiles } from "@/shared/lib/image-convert";

interface PhotoUploadFieldProps {
  previewImages: { file: File; url: string }[];
  setPreviewImages: React.Dispatch<React.SetStateAction<{ file: File; url: string }[]>>;
}

export function PhotoUploadField({ previewImages, setPreviewImages }: PhotoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) {
      toast.error("Можно загрузить не больше 5 фото");
      return;
    }

    const processedFiles = await convertHeicFiles(files);
    const newPreviews = processedFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));

    setPreviewImages((prev) => [...prev, ...newPreviews]);
    toast.success(`Добавлено фото: ${files.length}`);
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Визуализация</div>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="min-h-[120px] sm:min-h-[140px] rounded-[var(--ui-radius-premium)] border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all group active:scale-[0.98]"
      >
        {previewImages.length === 0 ? (
          <>
            <div className="p-2 sm:p-3 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:bg-cyan-500 group-hover:text-white transition-all scale-90 sm:scale-100">
              <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-200">Прикрепить фото</p>
          </>
        ) : (
          <div className="flex flex-wrap gap-2 p-3 justify-center">
            {previewImages.map((img, i) => (
              <div key={img.url} className="relative w-16 h-16 rounded-[var(--ui-radius-premium)] overflow-hidden border border-white/10 group-hover:border-white/20">
                <img src={img.url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImages((p) => p.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-md text-white rounded-full p-0.5 hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
    </div>
  );
}

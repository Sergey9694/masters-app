"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/cn";

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string | null, file?: File) => void;
  className?: string;
}

export function AvatarUpload({ value, onChange, className }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(url, file);
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div 
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/10 overflow-hidden relative shadow-2xl transition-all group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20">
          {preview ? (
            <img 
              src={preview} 
              alt="Avatar preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
              <Camera className="w-8 h-8 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </div>
          )}

          <AnimatePresence>
            {isHovering && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
              >
                <Camera className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {preview && (
          <button
            onClick={onRemove}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-cyan-400">
        Личное фото
      </p>

      <input 
        type="file" 
        className="hidden" 
        accept="image/*" 
        ref={fileInputRef}
        onChange={onFileChange}
      />
    </div>
  );
}

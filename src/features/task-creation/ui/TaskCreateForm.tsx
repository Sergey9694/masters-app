"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  MapPin, 
  X, 
  Loader2, 
  PlusCircle,
  SendHorizontal,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card } from "@/shared/ui/card";
import { taskSchema, type TaskFormValues } from "../model/task-schema";
import { createOrderAction } from "../api/create-task-action";
import { uploadImagesAction } from "../api/upload-action";
import { cn } from "@/shared/lib/cn";

interface TaskCreateFormProps {
  categories: { id: string; name: string }[];
}

export function TaskCreateForm({ categories }: TaskCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewImages, setPreviewImages] = useState<{file: File, url: string}[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shSuggestions, setShSuggestions] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      budget: "",
      address: "",
      images: [],
    },
  });

  useEffect(() => {
    if (shSuggestions && inputRef.current) {
      setInputRect(inputRef.current.getBoundingClientRect());
    }
  }, [shSuggestions]);

  const fetchSuggest = async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      setShSuggestions(false);
      return;
    }
    const API_KEY = process.env.NEXT_PUBLIC_DADATA_API_KEY || "77e685fba3de2731885ccb806208316279f06c11";
    try {
      const resp = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Token ${API_KEY}`
        },
        body: JSON.stringify({ query })
      });
      const data = await resp.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions.map((s: any) => s.value));
        setShSuggestions(true);
      } else {
        setShSuggestions(false);
      }
    } catch (e) {
      console.warn("DaData error");
    }
  };

  const handleGeo = () => {
    setIsLocating(true);
    toast.info("GPRS Поиск...");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("lat", pos.coords.latitude);
        form.setValue("lng", pos.coords.longitude);
        toast.success("Координаты получены");
        setIsLocating(false);
      },
      (err) => {
        toast.error(`Geo error: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) return toast.error("Limited to 5 photos");
    setPreviewImages(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    toast.success(`${files.length} images added`);
  };

  const onSubmit = async (vals: TaskFormValues) => {
    startTransition(async () => {
      try {
        let urls: string[] = [];
        if (previewImages.length > 0) {
          setIsUploading(true);
          const fd = new FormData();
          previewImages.forEach(p => fd.append("images", p.file));
          urls = await uploadImagesAction(fd);
          setIsUploading(false);
        }
        const res = await createOrderAction({ ...vals, images: urls });
        
        if (res.success) {
          toast.success("Тендер успешно опубликован!");
          setTimeout(() => {
            router.push(res.redirect);
          }, 1500);
        }
      } catch (err: any) {
        toast.error(err.message || "Publication error");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-12 pb-16">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card className="glass-premium border-none p-6 sm:p-8 rounded-[var(--ui-radius-premium)] shadow-2xl relative space-y-8 overflow-visible group/card">
            {/* Ambient Multi-Accent Glows */}
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-cyan-500/10 blur-[60px] sm:blur-[100px] -mr-12 sm:-mr-24 -mt-12 sm:-mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-indigo-500/10 blur-[60px] sm:blur-[100px] -ml-12 sm:-ml-24 -mb-12 sm:-mb-24 pointer-events-none" />
            
            <header className="space-y-1 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="h-1.5 w-8 rounded-full bg-indigo-500/30" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                Создать тендер
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">District Master • Precision Flow</p>
            </header>

            <div className="space-y-6 relative z-10">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Что нужно сделать?</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Сборка мебели ИКЕА" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photos Dropzone */}
              <div className="space-y-2">
                <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Визуализация</FormLabel>
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
                             <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewImages(p => p.filter((_, idx)=>idx!==i)); }} className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-md text-white rounded-full p-0.5 hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Готовы оплатить (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Бюджет" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Подробнее</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите масштаб работы..." className="min-h-[140px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative z-20">
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1 flex justify-between">
                      <span>Где находится объект?</span>
                      {form.getValues("lat") && (
                         <span className="text-emerald-400 font-black tracking-tighter flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            GPS ACTIVE
                         </span>
                      )}
                    </FormLabel>
                    <div className="flex gap-2">
                       <FormControl>
                         <Input 
                            {...field}
                            ref={(node) => {
                              (inputRef.current as any) = node;
                              field.ref(node);
                            }}
                            autoComplete="off"
                            placeholder="Локация?" 
                            onChange={(e) => { 
                              field.onChange(e); 
                              fetchSuggest(e.target.value); 
                            }}
                            onBlur={() => {
                              field.onBlur();
                              setTimeout(() => setShSuggestions(false), 200);
                            }}
                         />
                       </FormControl>
                       <Button type="button" variant="outline" size="icon" className="w-[var(--ui-input-h-mobile)] h-[var(--ui-input-h-mobile)] sm:w-[var(--ui-input-h-desktop)] sm:h-[var(--ui-input-h-desktop)] rounded-[var(--ui-radius-premium)] border-white/10 bg-white/5 transition-all active:scale-95 group/geo" onClick={handleGeo} disabled={isLocating}>
                         {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : <MapPin className="w-5 h-5 group-hover/geo:text-emerald-400 transition-colors" />}
                       </Button>
                    </div>
                    
                    {typeof document !== "undefined" && shSuggestions && suggestions.length > 0 && inputRect &&
                      createPortal(
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{
                            position: 'fixed',
                            top: inputRect.bottom + 8,
                            left: inputRect.left,
                            width: inputRect.width,
                          }}
                          className="bg-[#0d0f16]/95 backdrop-blur-3xl border border-white/10 rounded-[var(--ui-radius-premium)] overflow-hidden shadow-2xl z-[9999] font-sans"
                        >
                          {suggestions.map((s, i) => (
                            <button key={i} type="button" className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-300 hover:bg-indigo-600/40 hover:text-white transition-all border-b border-white/5 last:border-none" onMouseDown={(e) => {
                              e.preventDefault();
                              form.setValue("address", s);
                              setSuggestions([]);
                              setShSuggestions(false);
                            }}>
                              {s}
                            </button>
                          ))}
                        </motion.div>,
                        document.body
                      )
                    }
                  </FormItem>
                )}
              />
            </div>

            <Button 
               type="submit" 
               variant="premium"
               size="xl" 
               disabled={isPending || isUploading} 
               className="w-full relative group rounded-[var(--ui-radius-premium)] mt-8"
            >
               {isPending || isUploading ? (
                 <Loader2 className="w-7 h-7 animate-spin" />
               ) : (
                 <div className="flex items-center gap-4">
                   <span>Опубликовать тендер</span>
                   <SendHorizontal className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Button>
            
            <footer className="pt-4 flex justify-center opacity-30 relative z-10">
               <div className="flex items-center gap-6">
                 <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                 <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-indigo-500/50" />
               </div>
            </footer>
          </Card>
        </form>
      </Form>
    </div>
  );
}

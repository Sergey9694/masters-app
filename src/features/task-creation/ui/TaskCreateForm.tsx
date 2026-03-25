"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { 
  Camera, 
  MapPin, 
  X, 
  Loader2, 
  ImagePlus,
  SendHorizontal,
  PlusCircle,
  Clock
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

interface TaskCreateFormProps {
  categories: { id: string; name: string }[];
}

export function TaskCreateForm({ categories }: TaskCreateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewImages, setPreviewImages] = useState<{file: File, url: string}[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shSuggestions, setShSuggestions] = useState(false);
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

  // —————————————————————————————————————————————————————————————————————————————————————
  // ADDRESS ADAPTIVE DROPDOWN (Smart API Logic)
  // —————————————————————————————————————————————————————————————————————————————————————
  const fetchSuggest = async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }
    
    // Using Env Key or fallback to public demo if not provided
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
      if (data.suggestions) {
        setSuggestions(data.suggestions.map((s: any) => s.value));
        setShSuggestions(true);
      }
    } catch (e) {
      console.warn("API Dadata restricted or blocked");
    }
  };

  const handleGeo = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("lat", pos.coords.latitude);
        form.setValue("lng", pos.coords.longitude);
        toast.success("Координаты определены");
        setIsLocating(false);
      },
      () => {
        toast.error("Не удалось получить гео-позицию");
        setIsLocating(false);
      }
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) return toast.error("Максимум 5 фото");
    setPreviewImages(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
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
        await createOrderAction({ ...vals, images: urls });
        toast.success("Ваш тендер опубликован!");
      } catch (err: any) {
        // Essential: Ignore NEXT_REDIRECT error in catch block
        if (err.message && err.message.includes("NEXT_REDIRECT")) {
          return;
        }
        toast.error(err.message || "Ошибка публикации");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card className="glass-premium border-none p-10 rounded-[48px] shadow-2xl relative overflow-hidden space-y-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[100px] -mr-24 -mt-24 pointer-events-none" />
            
            <header className="space-y-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Новый заказ</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Академический микрорайон • Гиперлокально</p>
              </div>
            </header>

            <div className="space-y-8">
              {/* Title Input */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Что нужно сделать?</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Повесить люстру в гостиной" className="h-16 px-6 bg-white/5 border-white/10 text-lg font-medium rounded-3xl focus:ring-blue-500/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photos Dropzone (Requested by User) */}
              <div className="space-y-4">
                <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Прикрепите фото (до 5 штук)</FormLabel>
                
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="min-h-[160px] rounded-[36px] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transition-all group active:scale-[0.98]"
                >
                   {previewImages.length === 0 ? (
                     <>
                       <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <Camera className="w-8 h-8" />
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Нажмите для выбора фото</p>
                     </>
                   ) : (
                     <div className="flex flex-wrap gap-4 p-6 justify-center">
                        <AnimatePresence>
                          {previewImages.map((img, i) => (
                            <motion.div key={img.url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                               <img src={img.url} className="w-full h-full object-cover" />
                               <button 
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); setPreviewImages(p => p.filter((_, idx)=>idx!==i)); }} 
                                 className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 shadow-lg hover:scale-110 active:scale-90"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {previewImages.length < 5 && (
                          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors">
                             <PlusCircle className="w-8 h-8" />
                          </div>
                        )}
                     </div>
                   )}
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onFile} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-3xl">
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-premium border-white/10">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="focus:bg-blue-500 focus:text-white">{cat.name}</SelectItem>
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
                      <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Рассчитываю на..." className="h-16 px-6 bg-white/5 border-white/10 rounded-3xl font-bold" {...field} />
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
                    <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Подробности</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите масштаб работы, пожелания и важные нюансы..." className="min-h-[140px] px-6 py-4 bg-white/5 border-white/10 rounded-3xl text-base leading-relaxed" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Address suggestions fixed logic */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="text-xs uppercase font-black tracking-widest opacity-70 px-1">Где выполнить?</FormLabel>
                    <div className="flex gap-2">
                       <FormControl>
                         <Input 
                            {...field}
                            autoComplete="off"
                            placeholder="Введите адрес..." 
                            className="flex-1 h-16 px-6 bg-white/5 border-white/10 rounded-3xl font-medium"
                            onChange={(e) => {
                               field.onChange(e);
                               fetchSuggest(e.target.value);
                            }}
                         />
                       </FormControl>
                       <Button type="button" variant="outline" size="icon" className="w-16 h-16 rounded-[22px] border-white/10 bg-white/5 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-500/10" onClick={handleGeo} disabled={isLocating}>
                         {isLocating ? <Loader2 className="w-6 h-6 animate-spin" /> : <MapPin className="w-6 h-6" />}
                       </Button>
                    </div>
                    
                    {/* Floating Suggest Box */}
                    <AnimatePresence>
                      {shSuggestions && suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 left-0 right-0 mt-2 bg-[#1a1c24]/90 backdrop-blur-3xl border border-white/10 rounded-[30px] overflow-hidden shadow-2xl"
                        >
                          {suggestions.map((s, i) => (
                            <button 
                              key={i} 
                              type="button" 
                              className="w-full p-5 text-left text-sm font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition-all border-b border-white/5 last:border-none" 
                              onClick={() => {
                                form.setValue("address", s);
                                setSuggestions([]);
                                setShSuggestions(false);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
               type="submit" 
               size="lg" 
               disabled={isPending || isUploading} 
               className="w-full h-22 rounded-[36px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:scale-[1.01] active:scale-95 transition-all text-xl relative overflow-hidden group"
            >
               {isPending || isUploading ? (
                 <Loader2 className="w-8 h-8 animate-spin" />
               ) : (
                 <div className="flex items-center gap-4 relative z-10">
                   <SendHorizontal className="w-7 h-7" />
                   <span>Опубликовать тендер</span>
                 </div>
               )}
               {/* Shine effect */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Button>

            <FormDescription className="text-center text-[10px] font-black uppercase tracking-[0.25em] opacity-40">
              Нажимая опубликовать, вы соглашаетесь с правилами тендерного движка 2026
            </FormDescription>
          </Card>
        </form>
      </Form>
    </div>
  );
}

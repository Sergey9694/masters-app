"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { 
  Camera, 
  MapPin, 
  X, 
  Loader2, 
  PlusCircle,
  SendHorizontal,
  CheckCircle2
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

  const fetchSuggest = async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
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
      if (data.suggestions) {
        setSuggestions(data.suggestions.map((s: any) => s.value));
        setShSuggestions(true);
      }
    } catch (e) {
      console.warn("DaData restricted or blocked");
    }
  };

  const handleGeo = () => {
    setIsLocating(true);
    toast.info("Запрашиваем доступ к GPS...");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("lat", pos.coords.latitude);
        form.setValue("lng", pos.coords.longitude);
        toast.success("Местоположение определено");
        setIsLocating(false);
      },
      (err) => {
        toast.error(`Гео-позиция недоступна: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) return toast.error("Максимум 5 фото");
    setPreviewImages(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    toast.success(`${files.length} фото добавлено`);
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
        toast.success("Тендер опубликован!");
      } catch (err: any) {
        if (err.message && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err.message || "Ошибка публикации");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-0 pb-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card className="glass-premium border-none p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl relative space-y-8">
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-blue-500/10 blur-[60px] sm:blur-[100px] -mr-12 sm:-mr-24 -mt-12 sm:-mt-24 pointer-events-none" />
            
            <header className="space-y-2 relative z-10">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Создать тендер</h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Академический • Прецизионный движок</p>
            </header>

            <div className="space-y-6 relative z-10">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1">Задача</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Сборка кухни Леруа" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photos Dropzone */}
              <div className="space-y-2">
                <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1">Фото</FormLabel>
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="min-h-[120px] sm:min-h-[140px] rounded-[24px] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transition-all group active:scale-[0.98]"
                >
                   {previewImages.length === 0 ? (
                     <>
                       <div className="p-2 sm:p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all scale-90 sm:scale-100">
                          <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                       </div>
                       <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500">Добавить фото</p>
                     </>
                   ) : (
                     <div className="flex flex-wrap gap-2 p-3 justify-center">
                        {previewImages.map((img, i) => (
                          <div key={img.url} className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-white/20">
                             <img src={img.url} className="w-full h-full object-cover" />
                             <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewImages(p => p.filter((_, idx)=>idx!==i)); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
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
                      <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1">Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border-white/10">
                            <SelectValue placeholder="Тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-premium border-white/10 z-[1100]">
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
                      <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1">Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Оплата" {...field} />
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
                    <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1">Детали</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите масштаб работы..." className="min-h-[100px] sm:min-h-[120px]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative z-20">
                    <FormLabel className="text-[9px] uppercase font-black tracking-widest opacity-50 px-1 flex justify-between">
                      <span>Адрес</span>
                      {form.getValues("lat") && <span className="text-emerald-500 font-black">GPS ACTIVE</span>}
                    </FormLabel>
                    <div className="flex gap-2">
                       <FormControl>
                         <Input 
                            {...field}
                            autoComplete="off"
                            placeholder="Локация?" 
                            onChange={(e) => { field.onChange(e); fetchSuggest(e.target.value); }}
                         />
                       </FormControl>
                       <Button type="button" variant="outline" size="icon" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-white/10 bg-white/5 transition-all active:scale-90" onClick={handleGeo} disabled={isLocating}>
                         {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                       </Button>
                    </div>
                    
                    <AnimatePresence>
                      {shSuggestions && suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute left-0 right-0 top-full mt-3 bg-[#12141c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[1000]"
                        >
                          {suggestions.map((s, i) => (
                            <button key={i} type="button" className="w-full px-5 py-3.5 text-left text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border-b border-white/5 last:border-none" onClick={() => {
                              form.setValue("address", s);
                              setSuggestions([]);
                              setShSuggestions(false);
                            }}>
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FormItem>
                )}
              />
            </div>

            <Button 
               type="submit" 
               variant="premium"
               size="xl" 
               disabled={isPending || isUploading} 
               className="w-full relative group"
            >
               {isPending || isUploading ? (
                 <Loader2 className="w-7 h-7 animate-spin" />
               ) : (
                 <div className="flex items-center gap-3">
                   <span>Опубликовать тендер</span>
                   <SendHorizontal className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Button>
          </Card>
        </form>
      </Form>
    </div>
  );
}

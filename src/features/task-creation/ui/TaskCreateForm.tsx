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
  ChevronDown
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
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  // ADDRESS SUGGESTIONS (API DADATA)
  // —————————————————————————————————————————————————————————————————————————————————————
  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "Token 77e685fba3de2731885ccb806208316279f06c11" // Public Demo Token (or replace with your own)
        },
        body: JSON.stringify({ query: query, count: 5 })
      });
      const result = await response.json();
      setSuggestions(result.suggestions.map((s: any) => s.value));
      setShowSuggestions(true);
    } catch (error) {
      console.error("Suggestions error:", error);
    }
  };

  const handleGeoLocation = () => {
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) return toast.error("Максимум 5 фото");
    setPreviewImages(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
  };

  const onSubmit = async (data: TaskFormValues) => {
    startTransition(async () => {
      try {
        let imageUrls: string[] = [];
        if (previewImages.length > 0) {
          setIsUploading(true);
          const fd = new FormData();
          previewImages.forEach(p => fd.append("images", p.file));
          imageUrls = await uploadImagesAction(fd);
          setIsUploading(false);
        }
        await createOrderAction({ ...data, images: imageUrls });
        toast.success("Тендер опубликован!");
      } catch (err) {
        toast.error("Ошибка при публикации");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Main Glass Concept */}
          <div className="glass-premium p-8 rounded-[40px] border border-white/20 dark:border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <header className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Новый тендер</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Заполните детали заказа</p>
            </header>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Что нужно сделать?</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Починить кран" className="h-14 bg-white/5 border-white/10 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип услуги</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10">
                            <SelectValue placeholder="Выбрать" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass border-slate-800">
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
                      <FormLabel>Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Договорная" className="h-14 bg-white/5 border-white/10" {...field} />
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
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите подробности..." className="min-h-[100px] bg-white/5 border-white/10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Photos Row */}
              <div className="space-y-3">
                <FormLabel>Фотографии (до 5 штук)</FormLabel>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  <AnimatePresence>
                    {previewImages.map((img, i) => (
                      <motion.div key={img.url} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10">
                         <img src={img.url} className="w-full h-full object-cover" />
                         <button onClick={() => setPreviewImages(p => p.filter((_, idx)=>idx!==i))} className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white"><X className="w-3 h-3" /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {previewImages.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 shrink-0 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all bg-white/5">
                      <ImagePlus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              </div>

              {/* Address with Autocomplete */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Адрес выполнения</FormLabel>
                    <div className="flex gap-2">
                       <FormControl>
                         <Input 
                            {...field}
                            autoComplete="off"
                            placeholder="Начните вводить адрес..." 
                            className="flex-1 h-14 bg-white/5 border-white/10"
                            onChange={(e) => {
                               field.onChange(e);
                               fetchSuggestions(e.target.value);
                            }}
                            onFocus={() => setShowSuggestions(suggestions.length > 0)}
                         />
                       </FormControl>
                       <Button type="button" variant="outline" size="icon" className="w-14 h-14 rounded-2xl border-white/10 bg-white/5" onClick={handleGeoLocation} disabled={isLocating}>
                         {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                       </Button>
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-[100] top-full left-0 w-full mt-2 glass-premium border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        {suggestions.map((s, i) => (
                          <button key={i} type="button" className="w-full p-4 text-left text-sm font-medium hover:bg-white/10 transition-colors border-b border-white/5 last:border-none" onClick={() => {
                            form.setValue("address", s);
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" size="lg" disabled={isPending || isUploading} className="w-full h-18 rounded-[28px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
               {isPending || isUploading ? (
                 <Loader2 className="w-6 h-6 animate-spin" />
               ) : (
                 <div className="flex items-center gap-3">
                   <SendHorizontal className="w-5 h-5" />
                   <span>Опубликовать тендер</span>
                 </div>
               )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

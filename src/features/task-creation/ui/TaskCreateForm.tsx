"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  Loader2,
  PlusCircle,
  SendHorizontal,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import {
  SLIDE_UP,
  HOVER_GLOW,
  CLICK_SCALE,
} from "@/shared/lib/motion";

import { Button } from "@/shared/ui/button";
import { MotionToast } from "@/shared/ui/motion-toast";
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

interface TaskCreateFormProps {
  categories: { id: string; name: string }[];
}

export function TaskCreateForm({ categories }: TaskCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showSuggestions && addressInputRef.current) {
      setInputRect(addressInputRef.current.getBoundingClientRect());
    }
  }, [showSuggestions]);

  const fetchAddressSuggest = (query: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      suggestAbortRef.current?.abort();
      const ac = new AbortController();
      suggestAbortRef.current = ac;
      try {
        const resp = await fetch(
          `/api/suggest/address?q=${encodeURIComponent(query)}`,
          { signal: ac.signal },
        );
        if (!resp.ok) return;
        const data = (await resp.json()) as { suggestions?: string[] };
        const list = data.suggestions ?? [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("[suggest] fetch error", e);
        }
      }
    }, 250);
  };

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

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewImages.length > 5) {
      toast.error("Можно загрузить не больше 5 фото");
      return;
    }
    setPreviewImages((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
    toast.success(`Добавлено фото: ${files.length}`);
  };

  const onSubmit = async (vals: TaskFormValues) => {
    startTransition(async () => {
      try {
        let urls: string[] = [];
        if (previewImages.length > 0) {
          setIsUploading(true);
          const fd = new FormData();
          previewImages.forEach((p) => fd.append("images", p.file));
          urls = await uploadImagesAction(fd);
          setIsUploading(false);
        }
        const res = await createOrderAction({ ...vals, images: urls });

        if (res.success) {
          toast.custom(() => (
            <MotionToast type="success">Тендер успешно опубликован!</MotionToast>
          ));
          setTimeout(() => {
            router.push(res.redirect);
          }, 1000);
          return;
        }

        if (res.error) {
          toast.error(res.error);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Ошибка публикации";
        toast.error(message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="container-standard">
      <Form {...form}>
        <motion.form
          initial="initial"
          animate="animate"
          variants={SLIDE_UP}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 sm:space-y-12"
        >
          <Card className="glass-premium border-none p-6 sm:p-8 rounded-[var(--ui-radius-premium)] shadow-2xl relative overflow-visible group/card">
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
                      <FormMessage />
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
                      <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative z-20">
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Где находится объект?</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={(node) => {
                          addressInputRef.current = node;
                          field.ref(node);
                        }}
                        autoComplete="off"
                        placeholder="Город, улица, дом"
                        onChange={(e) => {
                          field.onChange(e);
                          fetchAddressSuggest(e.target.value);
                        }}
                        onBlur={() => {
                          field.onBlur();
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />
                    </FormControl>
                    <FormMessage />

                    {typeof document !== "undefined" &&
                      showSuggestions &&
                      suggestions.length > 0 &&
                      inputRect &&
                      createPortal(
                        <div
                          style={{
                            position: "fixed",
                            top: inputRect.bottom + 8,
                            left: inputRect.left,
                            width: inputRect.width,
                          }}
                          className="bg-[#0d0f16]/95 backdrop-blur-3xl border border-white/10 rounded-[var(--ui-radius-premium)] overflow-hidden shadow-2xl z-[9999] font-sans"
                        >
                          {suggestions.map((s, i) => (
                            <button
                              key={`${s}-${i}`}
                              type="button"
                              className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-300 hover:bg-indigo-600/40 hover:text-white transition-all border-b border-white/5 last:border-none"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                form.setValue("address", s, { shouldValidate: true });
                                setSuggestions([]);
                                setShowSuggestions(false);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>,
                        document.body,
                      )}
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              variant="premium"
              size="xl"
              asChild
              disabled={isPending || isUploading}
              className="w-full relative group rounded-[var(--ui-radius-premium)] mt-6"
            >
              <motion.button whileHover={HOVER_GLOW} whileTap={CLICK_SCALE}>
                {isPending || isUploading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <div className="flex items-center gap-4">
                    <span>Опубликовать тендер</span>
                    <SendHorizontal className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </motion.button>
            </Button>

            <footer className="pt-3 flex justify-center opacity-30 relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-indigo-500/50" />
              </div>
            </footer>
          </Card>
        </motion.form>
      </Form>
    </div>
  );
}

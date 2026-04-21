"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  SendHorizontal,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import {
  SLIDE_UP,
  HOVER_GLOW,
  CLICK_SCALE,
} from "@/shared/lib/motion";

import { Button, buttonVariants } from "@/shared/ui/button";
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
import { orderSchema, type OrderFormValues } from "../model/order-schema";
import { createOrderAction } from "../api/create-order-action";
import { uploadImagesAction } from "../api/upload-action";
import { PhotoUploadField } from "./PhotoUploadField";
import { AddressField } from "./AddressField";

interface OrderCreateFormProps {
  categories: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  defaultCityId?: string;
}

export function OrderCreateForm({ categories, cities, defaultCityId }: OrderCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      cityId: defaultCityId || "",
      budget: "",
      address: "",
      images: [],
    },
  });

  const onSubmit = async (vals: OrderFormValues) => {
    startTransition(async () => {
      try {
        let urls: string[] = [];
        if (previewImages.length > 0) {
          setIsUploading(true);
          const fd = new FormData();
          previewImages.forEach((p) => fd.append("images", p.file));
          
          const uploadRes = await uploadImagesAction(fd);
          setIsUploading(false);

          if (uploadRes.error) {
            toast.error(uploadRes.error);
            return;
          }
          
          urls = uploadRes.urls || [];
        }
        
        const res = await createOrderAction({ ...vals, images: urls });

        if (res?.data?.redirect) {
          toast.custom(() => (
            <MotionToast type="success">Заказ успешно опубликован!</MotionToast>
          ));
          setTimeout(() => {
            router.push(res.data!.redirect);
          }, 1000);
          return;
        }

        if (res?.serverError) {
          toast.error(res.serverError);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Ошибка публикации";
        toast.error(message);
        setIsUploading(false);
      }
    });
  };

  return (
    <Form {...form}>
      <motion.form
        initial="initial"
        animate="animate"
        variants={SLIDE_UP}
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("[OrderCreateForm] Validation errors:", errors);
          toast.error("Проверьте правильность заполнения формы");
        })}
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
              Создать заказ
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">УслугиРядом • Precision Flow</p>
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

            {/* Photos Dropzone Extracted */}
            <PhotoUploadField previewImages={previewImages} setPreviewImages={setPreviewImages} />

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
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Город</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите город" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
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

            {/* Address Field Extracted */}
            <AddressField form={form} />
          </div>

          <motion.button
            type="submit"
            disabled={isPending || isUploading}
            whileHover={!isPending && !isUploading ? HOVER_GLOW : undefined}
            whileTap={!isPending && !isUploading ? CLICK_SCALE : undefined}
            className={buttonVariants({ variant: "premium", size: "xl", className: "w-full relative group rounded-(--ui-radius-premium) mt-6" })}
          >
            {isPending || isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <div className="flex items-center gap-4">
                <span>Опубликовать заказ</span>
                <SendHorizontal className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </motion.button>

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
  );
}

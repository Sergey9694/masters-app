"use client";

import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SendHorizontal, Check, Briefcase, Banknote, Camera } from "lucide-react";

import { SLIDE_UP, HOVER_GLOW, CLICK_SCALE } from "@/shared/lib/motion";
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
import { Textarea } from "@/shared/ui/textarea";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { MasterProfileFormValues, MasterProfileFormInput, masterProfileSchema } from "../model/schema";
import { saveProviderProfileAction } from "../api/actions";
import { AvatarUpload } from "./AvatarUpload";
import { PhotoUploadField } from "@/shared/ui/photo-upload-field";
import { uploadImagesAction } from "@/shared/lib/upload-action";
import { Input } from "@/shared/ui/input";

interface Props {
  categories: { id: string; name: string }[];
  initialData?: Partial<MasterProfileFormValues>;
  isUpdate?: boolean;
}

export function ProviderRegistrationForm({ categories, initialData, isUpdate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<MasterProfileFormInput, any, MasterProfileFormValues>({
    resolver: zodResolver(masterProfileSchema),
    defaultValues: { 
      bio: (initialData?.bio as string) || "", 
      categoryIds: initialData?.categoryIds || [],
      experienceYears: initialData?.experienceYears ?? 0,
      minPrice: initialData?.minPrice ?? 0,
      portfolio: initialData?.portfolio || [],
      avatarUrl: initialData?.avatarUrl || ""
    },
  });

  const onSubmit: SubmitHandler<MasterProfileFormValues> = (vals) => {
    startTransition(async () => {
      try {
        let portfolioUrls: string[] = [];
        
        if (previewImages.length > 0 || avatarFile) {
          setIsUploading(true);
          const fd = new FormData();
          previewImages.forEach((p) => fd.append("images", p.file));
          
          if (avatarFile) {
            fd.append("avatar", avatarFile);
          }
          
          const uploadRes = await uploadImagesAction(fd);
          setIsUploading(false);

          if (uploadRes?.serverError || !uploadRes?.data) {
            toast.error(uploadRes?.serverError || "Ошибка при загрузке фото");
            return;
          }
          portfolioUrls = uploadRes.data.urls || [];
          const uploadedAvatarUrl = uploadRes.data.avatarUrl;

          if (uploadedAvatarUrl) {
            vals.avatarUrl = uploadedAvatarUrl;
          }
        }

        const res = await saveProviderProfileAction({ 
          ...vals, 
          portfolio: portfolioUrls,
          avatarUrl: vals.avatarUrl
        });

        if (res?.data?.success) {
          toast.custom(() => (
            <MotionToast type="success">
              {isUpdate ? "Профиль обновлен!" : "Вы теперь мастер!"}
            </MotionToast>
          ));
          if (res.data.redirect) {
            setTimeout(() => router.push(res.data.redirect), 800);
          }
          return;
        }
        toast.error(res?.serverError || "Ошибка при сохранении профиля");
      } catch (error) {
        toast.error("Ошибка при сохранении профиля");
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
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <Card className="glass-premium border-none p-6 sm:p-8 rounded-[var(--ui-radius-premium)] shadow-2xl relative overflow-hidden group/card">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[100px] -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-[100px] -ml-24 -mb-24 pointer-events-none" />


          <AvatarUpload 
            value={form.getValues("avatarUrl")}
            onChange={(url, file) => {
              if (file) setAvatarFile(file);
              form.setValue("avatarUrl", url || "");
            }}
            className="mb-8"
          />

          <div className="space-y-6 relative z-10">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                    О себе
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите о вашем опыте, дипломах, какими инструментами владеете..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1 flex items-center gap-2">
                      Опыт (лет) <Briefcase className="w-3 h-3" />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1 flex items-center gap-2">
                      Цена от (₽) <Banknote className="w-3 h-3" />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1 flex items-center gap-2">
                Портфолио <Camera className="w-3 h-3" />
              </FormLabel>
              <PhotoUploadField previewImages={previewImages} setPreviewImages={setPreviewImages} />
            </div>

            <Controller
              control={form.control}
              name="categoryIds"
              render={({ field, fieldState }) => {
                const value = field.value as string[];
                return (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">
                    В каких категориях работаете?
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = value.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? value.filter((id) => id !== cat.id)
                              : [...value, cat.id];
                            field.onChange(next);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5",
                            selected
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20",
                          )}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                  {fieldState.error && (
                    <p className="text-xs text-red-400 font-bold mt-2">
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              );
              }}
            />
          </div>

          <Button
            type="submit"
            variant="premium"
            size="xl"
            asChild
            disabled={isPending || isUploading}
            className="w-full relative group rounded-[var(--ui-radius-premium)] mt-8"
          >
            <motion.button whileHover={HOVER_GLOW} whileTap={CLICK_SCALE}>
              {isPending || isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2 sm:gap-4">
                  <span>{isUpdate ? "Сохранить изменения" : "Зарегистрироваться как мастер"}</span>
                  <SendHorizontal className="w-4 h-4 sm:w-5 sm:h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all flex-shrink-0" />
                </div>
              )}
            </motion.button>
          </Button>
        </Card>
      </motion.form>
    </Form>
  );
}

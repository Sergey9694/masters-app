"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  SendHorizontal,
  Check,
  Camera,
  X,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { convertHeicFiles } from "@/shared/lib/image-convert";
import { uploadImagesAction } from "@/shared/lib/upload-action";
import {
  MasterProfileFormValues,
  MasterProfileFormInput,
  masterProfileSchema,
} from "../model/schema";
import { saveProviderProfileAction } from "../api/actions";

interface Props {
  categories: { id: string; name: string }[];
  initialData?: Partial<MasterProfileFormValues>;
  isUpdate?: boolean;
}

type Preview = { file: File; url: string };

export function ProviderRegistrationFormLight({
  categories,
  initialData,
  isUpdate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [portfolioPreviews, setPortfolioPreviews] = useState<Preview[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatarUrl ?? null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  const form = useForm<MasterProfileFormInput, unknown, MasterProfileFormValues>({
    resolver: zodResolver(masterProfileSchema),
    defaultValues: {
      bio: initialData?.bio ?? "",
      categoryIds: initialData?.categoryIds ?? [],
      experienceYears: initialData?.experienceYears ?? 0,
      minPrice: initialData?.minPrice ?? 0,
      portfolio: initialData?.portfolio ?? [],
      avatarUrl: initialData?.avatarUrl ?? "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onPortfolioPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    e.target.value = "";
    const remaining = 8 - portfolioPreviews.length;
    if (remaining <= 0) {
      toast.error("Лимит 8 фото достигнут");
      return;
    }

    const toProcess = files.slice(0, remaining);
    
    setIsProcessingFiles(true);
    try {
      const processed = await convertHeicFiles(toProcess);
      setPortfolioPreviews((prev) => [
        ...prev,
        ...processed.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
      ]);
    } catch (err) {
      console.error("[onPortfolioPick] error:", err);
      toast.error("Ошибка при обработке изображений");
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const removePortfolio = (i: number) => {
    setPortfolioPreviews((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const onSubmit = (vals: MasterProfileFormValues) => {
    startTransition(async () => {
      try {
        let portfolioUrls: string[] = vals.portfolio ?? [];
        let uploadedAvatarUrl = vals.avatarUrl;

        if (portfolioPreviews.length > 0 || avatarFile) {
          setIsUploading(true);
          const fd = new FormData();
          portfolioPreviews.forEach((p) => fd.append("images", p.file));
          if (avatarFile) fd.append("avatar", avatarFile);

          const uploadRes = await uploadImagesAction(fd);
          setIsUploading(false);

          if (uploadRes?.serverError || !uploadRes?.data) {
            toast.error(uploadRes?.serverError ?? "Ошибка загрузки фото");
            return;
          }
          portfolioUrls = uploadRes.data.urls ?? [];
          if (uploadRes.data.avatarUrl) uploadedAvatarUrl = uploadRes.data.avatarUrl;
        }

        const res = await saveProviderProfileAction({
          ...vals,
          portfolio: portfolioUrls,
          avatarUrl: uploadedAvatarUrl,
        });

        if (res?.data?.success) {
          toast.success(isUpdate ? "Профиль обновлён" : "Вы теперь исполнитель!");
          router.push("/profile");
          return;
        }
        toast.error(res?.serverError ?? "Ошибка сохранения");
      } catch {
        setIsUploading(false);
        toast.error("Ошибка сохранения профиля");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className="group relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary/60"
        >
          {avatarPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera className="size-8 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6 text-white" />
          </div>
        </button>
        {avatarPreview && (
          <button
            type="button"
            onClick={() => {
              setAvatarPreview(null);
              setAvatarFile(null);
            }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Удалить фото
          </button>
        )}
        <p className="text-xs text-muted-foreground">Фото профиля</p>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onAvatarChange}
        />
      </div>

      {/* Bio */}
      <Field label="О себе" hint="Опыт, навыки, дипломы" error={errors.bio?.message}>
        <textarea
          rows={4}
          placeholder="Расскажите о вашем опыте..."
          {...register("bio")}
          className={cn(
            "min-h-28 w-full resize-y rounded-xl border bg-background p-3 text-sm",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
            errors.bio ? "border-destructive" : "border-border"
          )}
        />
      </Field>

      {/* Experience + Price */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Опыт (лет)" error={errors.experienceYears?.message}>
          <input
            type="number"
            min={0}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            {...register("experienceYears")}
            className={inputCls(!!errors.experienceYears)}
          />
        </Field>
        <Field label="Цена от (₽)" error={errors.minPrice?.message}>
          <input
            type="number"
            min={0}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            {...register("minPrice")}
            className={inputCls(!!errors.minPrice)}
          />
        </Field>
      </div>

      {/* Categories */}
      <Controller
        control={control}
        name="categoryIds"
        render={({ field, fieldState }) => {
          const value = field.value as string[];
          return (
            <Field
              label="Специализации"
              hint="Выберите одну или несколько категорий"
              error={fieldState.error?.message}
            >
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = value.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        field.onChange(
                          selected
                            ? value.filter((id) => id !== cat.id)
                            : [...value, cat.id]
                        );
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          );
        }}
      />

      {/* Portfolio */}
      <Field label="Портфолио" hint="До 8 фото ваших работ">
        <div
          onClick={() => !isProcessingFiles && portfolioPreviews.length < 8 && portfolioRef.current?.click()}
          className={cn(
            "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all",
            portfolioPreviews.length < 8
              ? "border-border hover:border-primary/50 hover:bg-muted/30"
              : "cursor-not-allowed border-border opacity-60",
            isProcessingFiles && "cursor-wait opacity-50"
          )}
        >
          {isProcessingFiles ? (
            <Loader2 className="size-7 animate-spin text-primary" />
          ) : (
            <ImageIcon className="size-7 text-muted-foreground" />
          )}
          <p className="text-sm font-medium text-foreground">
            {isProcessingFiles
              ? "Обработка изображений..."
              : portfolioPreviews.length < 8
              ? `Добавить фото (${portfolioPreviews.length}/8)`
              : "Лимит достигнут"}
          </p>
          {!isProcessingFiles && portfolioPreviews.length < 8 && (
            <p className="text-xs text-muted-foreground">
              Нажмите или перетащите файлы
            </p>
          )}
        </div>

        {portfolioPreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {portfolioPreviews.map((img, i) => (
              <div
                key={img.url}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePortfolio(i);
                  }}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {portfolioPreviews.length < 8 && (
              <button
                type="button"
                onClick={() => portfolioRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        )}
        <input
          ref={portfolioRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPortfolioPick}
        />
      </Field>

      <button
        type="submit"
        disabled={isPending || isUploading}
        className={cn(
          "mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm",
          "transition-all hover:brightness-110 disabled:opacity-50"
        )}
      >
        {isPending || isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <SendHorizontal className="size-4" />
        )}
        {isUpdate ? "Сохранить изменения" : "Стать исполнителем"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-background px-3 text-sm",
    "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
    hasError ? "border-destructive" : "border-border"
  );
}

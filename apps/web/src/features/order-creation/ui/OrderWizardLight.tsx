"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  SendHorizontal,
  X,
  Image as ImageIcon,
  Upload,
  Tag,
  FileText,
  Banknote,
  MapPin,
  Camera,
  ListChecks,
  Clock,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { convertHeicFiles } from "@/shared/lib/image-convert";
import { orderSchema, type OrderFormValues } from "../model/order-schema";
import { createOrderAction } from "../api/create-order-action";
import { uploadImagesAction } from "../api/upload-action";
import { DadataAddressInput } from "./DadataAddressInput";

interface Option {
  id: string;
  name: string;
}

interface OrderWizardLightProps {
  categories: Option[];
  cities: Option[];
  defaultCityId?: string;
}

type StepKey = "category" | "details" | "budget" | "photos" | "review";

interface StepDef {
  key: StepKey;
  title: string;
  subtitle: string;
  icon: typeof Tag;
  fields: (keyof OrderFormValues)[];
}

const STEPS: StepDef[] = [
  {
    key: "category",
    title: "Категория и город",
    subtitle: "Где и что нужно сделать",
    icon: Tag,
    fields: ["categoryId", "cityId"],
  },
  {
    key: "details",
    title: "Описание задачи",
    subtitle: "Расскажите, что именно требуется",
    icon: FileText,
    fields: ["title", "description"],
  },
  {
    key: "budget",
    title: "Бюджет и адрес",
    subtitle: "Сколько готовы заплатить и куда приехать",
    icon: Banknote,
    fields: ["budget", "address"],
  },
  {
    key: "photos",
    title: "Фото",
    subtitle: "Покажите объект (необязательно)",
    icon: Camera,
    fields: [],
  },
  {
    key: "review",
    title: "Проверка",
    subtitle: "Последний взгляд перед публикацией",
    icon: ListChecks,
    fields: [],
  },
];

type PreviewImage = { file: File; url: string };

export function OrderWizardLight({
  categories,
  cities,
  defaultCityId,
}: OrderWizardLightProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      cityId: defaultCityId ?? "",
      budget: "",
      address: "",
      images: [],
    },
  });

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const goNext = async () => {
    const fields = step.fields;
    if (fields.length > 0) {
      const ok = await form.trigger(fields);
      if (!ok) return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = () => {
    form.handleSubmit((vals: OrderFormValues) => {
      startTransition(async () => {
        try {
          let urls: string[] = [];
          if (previews.length > 0) {
            setIsUploading(true);
            const fd = new FormData();
            previews.forEach((p) => fd.append("images", p.file));
            const uploadRes = await uploadImagesAction(fd);
            setIsUploading(false);

            if (uploadRes.error) {
              toast.error(uploadRes.error);
              return;
            }
            urls = uploadRes.urls ?? [];
          }

          const res = await createOrderAction({ ...vals, images: urls });

          if (res?.data?.redirect) {
            toast.success("Заказ опубликован");
            router.push(res.data.redirect);
            return;
          }

          if (res?.serverError) {
            toast.error(res.serverError);
          }
        } catch (err: unknown) {
          setIsUploading(false);
          toast.error(err instanceof Error ? err.message : "Ошибка публикации");
        }
      });
    })();
  };

  return (
    <div className="flex flex-col gap-6">
      <Stepper currentIndex={stepIndex} />

      <div className="rounded-2xl border border-border/60 bg-surface p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <step.icon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.subtitle}</p>
          </div>
        </div>

        {/* Prevent accidental Enter-key form submission */}
        <div
          className="flex flex-col gap-5"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.target as HTMLElement).tagName !== "TEXTAREA"
            ) {
              e.preventDefault();
            }
          }}
        >
          {step.key === "category" && (
            <StepCategory form={form} categories={categories} cities={cities} />
          )}
          {step.key === "details" && <StepDetails form={form} />}
          {step.key === "budget" && <StepBudget form={form} />}
          {step.key === "photos" && (
            <StepPhotos previews={previews} setPreviews={setPreviews} />
          )}
          {step.key === "review" && (
            <StepReview
              form={form}
              categories={categories}
              cities={cities}
              previews={previews}
            />
          )}

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirst}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold",
                "transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
              )}
            >
              <ArrowLeft className="size-4" />
              Назад
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || isUploading}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm",
                  "transition-all hover:brightness-110 disabled:opacity-50"
                )}
              >
                {isPending || isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SendHorizontal className="size-4" />
                )}
                Опубликовать заказ
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm",
                  "transition-all hover:brightness-110"
                )}
              >
                Далее
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.key} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary/10 text-primary",
                !done && !active && "border-border bg-background text-muted-foreground"
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 sm:w-10",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepCategory({
  form,
  categories,
  cities,
}: {
  form: UseFormReturn<OrderFormValues>;
  categories: Option[];
  cities: Option[];
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const categoryId = watch("categoryId");

  return (
    <>
      <Field label="Категория" error={errors.categoryId?.message}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => {
            const selected = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setValue("categoryId", c.id, { shouldValidate: true })
                }
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                  selected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Город" error={errors.cityId?.message}>
        <select {...register("cityId")} className={inputCls(!!errors.cityId)}>
          <option value="">Выберите город</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

function StepDetails({ form }: { form: UseFormReturn<OrderFormValues> }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <Field
        label="Что нужно сделать?"
        hint="Кратко, одной строкой"
        error={errors.title?.message}
      >
        <input
          type="text"
          placeholder="Например: Собрать шкаф ИКЕА"
          {...register("title")}
          className={inputCls(!!errors.title)}
        />
      </Field>

      <Field
        label="Подробности"
        hint="Объём работ, сроки, особенности"
        error={errors.description?.message}
      >
        <textarea
          rows={6}
          placeholder="Опишите задачу подробно..."
          {...register("description")}
          className={cn(
            "min-h-35 w-full resize-y rounded-xl border bg-background p-3 text-sm",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
            errors.description ? "border-destructive" : "border-border"
          )}
        />
      </Field>
    </>
  );
}

function StepBudget({ form }: { form: UseFormReturn<OrderFormValues> }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const address = watch("address");

  return (
    <>
      <Field
        label="Готовы оплатить (₽)"
        hint="Оставьте пустым, если бюджет договорной"
        error={errors.budget?.message}
      >
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="3000"
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E") {
              e.preventDefault();
            }
          }}
          {...register("budget")}
          className={inputCls(!!errors.budget)}
        />
      </Field>

      <Field
        label="Адрес"
        hint="Где находится объект? Начните вводить — предложения подтянутся автоматически"
        error={errors.address?.message}
      >
        <DadataAddressInput
          value={address ?? ""}
          onChange={(v) => setValue("address", v, { shouldValidate: true })}
          onBlur={() => form.trigger("address")}
          hasError={!!errors.address}
        />
      </Field>
    </>
  );
}

function StepPhotos({
  previews,
  setPreviews,
}: {
  previews: PreviewImage[];
  setPreviews: React.Dispatch<React.SetStateAction<PreviewImage[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: File[]) => {
    const remaining = 5 - previews.length;
    if (remaining <= 0) {
      toast.error("Лимит 5 фото уже достигнут");
      return;
    }
    const toProcess = files.filter((f) => f.type.startsWith("image/")).slice(0, remaining);
    if (!toProcess.length) return;
    const processed = await convertHeicFiles(toProcess);
    const next: PreviewImage[] = processed.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPreviews((prev) => [...prev, ...next]);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await processFiles(files);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const remove = (i: number) => {
    setPreviews((p) => {
      const target = p[i];
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const canAdd = previews.length < 5;

  return (
    <div className="flex flex-col gap-4">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={canAdd ? 0 : -1}
        aria-label="Загрузить фото"
        onDragOver={(e) => {
          e.preventDefault();
          if (canAdd) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
          }
        }}
        onDrop={onDrop}
        onClick={() => canAdd && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (canAdd) inputRef.current?.click();
          }
        }}
        className={cn(
          "flex min-h-45 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200 select-none",
          canAdd ? "cursor-pointer" : "cursor-not-allowed opacity-60",
          isDragging
            ? "scale-[1.01] border-primary bg-primary/5"
            : canAdd
              ? "border-border bg-background hover:border-primary/50 hover:bg-muted/30"
              : "border-border bg-muted/20"
        )}
      >
        {isDragging ? (
          <>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="size-7" />
            </div>
            <p className="text-sm font-semibold text-primary">Отпустите для загрузки</p>
          </>
        ) : (
          <>
            <div className={cn(
              "flex size-14 items-center justify-center rounded-2xl transition-colors",
              canAdd ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50"
            )}>
              <ImageIcon className="size-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {canAdd
                  ? `Перетащите фото сюда (${previews.length}/5)`
                  : "Лимит достигнут (5/5)"}
              </p>
              {canAdd && (
                <p className="mt-1 text-xs text-muted-foreground">
                  или{" "}
                  <span className="text-primary underline underline-offset-2">
                    выберите с устройства
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {previews.map((img, i) => (
            <div
              key={img.url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        До 5 фото, до 25 МБ каждое. JPG, PNG, WebP, HEIC.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
    </div>
  );
}

function StepReview({
  form,
  categories,
  cities,
  previews,
}: {
  form: UseFormReturn<OrderFormValues>;
  categories: Option[];
  cities: Option[];
  previews: PreviewImage[];
}) {
  const vals = form.watch();
  const category = useMemo(
    () => categories.find((c) => c.id === vals.categoryId)?.name ?? "—",
    [categories, vals.categoryId]
  );
  const city = useMemo(
    () => cities.find((c) => c.id === vals.cityId)?.name ?? "—",
    [cities, vals.cityId]
  );

  return (
    <div className="flex flex-col gap-4">
      <Summary label="Категория" value={category} icon={<Tag className="size-4" />} />
      <Summary label="Город" value={city} icon={<MapPin className="size-4" />} />
      <Summary
        label="Заголовок"
        value={vals.title || "—"}
        icon={<FileText className="size-4" />}
      />
      <Summary
        label="Описание"
        value={vals.description || "—"}
        icon={<FileText className="size-4" />}
        multiline
      />
      <Summary
        label="Бюджет"
        value={vals.budget ? `${vals.budget} ₽` : "договорной"}
        icon={<Banknote className="size-4" />}
      />
      <Summary
        label="Адрес"
        value={vals.address || "не указан"}
        icon={<MapPin className="size-4" />}
      />

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ImageIcon className="size-4" />
          Фото ({previews.length})
        </div>
        {previews.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {previews.map((img) => (
              <div
                key={img.url}
                className="aspect-square overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Фото не добавлены</p>
        )}
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon,
  multiline,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-0.5 wrap-anywhere text-sm text-foreground",
            multiline ? "max-h-40 overflow-y-auto whitespace-pre-line" : "truncate"
          )}
        >
          {value}
        </div>
      </div>
    </div>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && !error && (
        <span className="text-xs text-muted-foreground/80">{hint}</span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-background px-3 text-sm",
    "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
    hasError ? "border-destructive" : "border-border"
  );
}

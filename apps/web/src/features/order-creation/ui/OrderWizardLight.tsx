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
  Plus,
  SendHorizontal,
  X,
  Image as ImageIcon,
  Tag,
  FileText,
  Banknote,
  MapPin,
  Camera,
  ListChecks,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { convertHeicFiles } from "@/shared/lib/image-convert";
import { orderSchema, type OrderFormValues } from "../model/order-schema";
import { createOrderAction } from "../api/create-order-action";
import { uploadImagesAction } from "../api/upload-action";

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

  const onSubmit = (vals: OrderFormValues) => {
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

        if (res?.data?.orderId) {
          toast.success("Заказ опубликован");
          router.push(`/orders/${res.data.orderId}`);
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

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
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
                type="submit"
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
        </form>
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
            "min-h-[140px] w-full resize-y rounded-xl border bg-background p-3 text-sm",
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
    formState: { errors },
  } = form;

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
          {...register("budget")}
          className={inputCls(!!errors.budget)}
        />
      </Field>

      <Field
        label="Адрес"
        hint="Где находится объект? Можно указать частично"
        error={errors.address?.message}
      >
        <input
          type="text"
          placeholder="Город, улица, дом"
          autoComplete="off"
          {...register("address")}
          className={inputCls(!!errors.address)}
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

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length + previews.length > 5) {
      toast.error("Можно загрузить не больше 5 фото");
      return;
    }
    const processed = await convertHeicFiles(files);
    const next: PreviewImage[] = processed.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPreviews((prev) => [...prev, ...next]);
  };

  const remove = (i: number) => {
    setPreviews((p) => {
      const target = p[i];
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {previews.map((img, i) => (
          <div
            key={img.url}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {previews.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-background",
              "text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            )}
          >
            <Plus className="size-5" />
            Добавить
          </button>
        )}
      </div>
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
    <div className="flex flex-col gap-5">
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
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-0.5 text-sm text-foreground",
            multiline && "whitespace-pre-line"
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

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createListingAction } from "@/features/listing-management";
import { createListingSchema, type CreateListingInput } from "@/features/listing-management";

interface Category { id: string; name: string }
interface City { id: string; name: string }

interface ListingFormProps {
  categories: Category[];
  cities: City[];
}

const PRICE_UNITS = [
  { value: "PER_HOUR", label: "За час" },
  { value: "PER_SERVICE", label: "За услугу" },
  { value: "PER_METER", label: "За м²" },
  { value: "NEGOTIABLE", label: "Договорная" },
] as const;

const fieldCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";
const errorCls = "mt-1 text-xs text-destructive";

export function ListingForm({ categories, cities }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priceUnit, setPriceUnit] = useState<string>("PER_SERVICE");

  const { register, handleSubmit, formState: { errors } } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: { priceUnit: "PER_SERVICE" },
  });

  const onSubmit = (data: CreateListingInput) => {
    startTransition(async () => {
      const result = await createListingAction(data);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Объявление создано!");
      router.push("/my-listings");
    });
  };

  const isNegotiable = priceUnit === "NEGOTIABLE";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/60 bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Основное</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Заголовок *</label>
            <input
              {...register("title")}
              placeholder="Например: Ремонт квартир под ключ"
              className={fieldCls}
            />
            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Описание *</label>
            <textarea
              {...register("description")}
              rows={5}
              placeholder="Расскажите о своём опыте, что входит в услугу, условия работы..."
              className={`${fieldCls} resize-none`}
            />
            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Категория *</label>
              <select {...register("categoryId")} className={fieldCls}>
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className={errorCls}>{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Город *</label>
              <select {...register("cityId")} className={fieldCls}>
                <option value="">Выберите город</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.cityId && <p className={errorCls}>{errors.cityId.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Адрес / район (необязательно)</label>
            <input
              {...register("address")}
              placeholder="Центральный район, улица Ленина..."
              className={fieldCls}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Цена</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Тип цены</label>
            <select
              {...register("priceUnit")}
              className={fieldCls}
              onChange={(e) => setPriceUnit(e.target.value)}
            >
              {PRICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>

          {!isNegotiable && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Цена от (₽)</label>
                <input
                  {...register("priceFrom", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="1000"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Цена до (₽)</label>
                <input
                  {...register("priceTo", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="5000"
                  className={fieldCls}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? "Публикация..." : "Опубликовать объявление"}
      </button>
    </form>
  );
}

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createListingAction, updateListingAction } from "@/features/listing-management";
import { createListingSchema, type CreateListingInput } from "@/features/listing-management";
import { DadataAddressInput } from "@/shared/ui/DadataAddressInput";
import { ensureCityAction } from "@/shared/lib/ensure-city-action";
import { GEO_LIMIT_MESSAGE } from "@/shared/config/geo";
import type { DadataSuggestion } from "@/shared/lib/dadata";

interface Category { id: string; name: string }

interface ListingFormProps {
  categories: Category[];
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: Partial<CreateListingInput>;
  isLimited?: boolean;
}

const PRICE_UNITS = [
  { value: "PER_HOUR", label: "За час" },
  { value: "PER_SERVICE", label: "За услугу" },
  { value: "PER_METER", label: "За м²" },
  { value: "NEGOTIABLE", label: "Договорная" },
] as const;

const fieldCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";
const errorCls = "mt-1 text-xs text-destructive";

export function ListingForm({ categories, mode = "create", listingId, initialData, isLimited }: ListingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priceUnit, setPriceUnit] = useState<string>(initialData?.priceUnit ?? "PER_SERVICE");
  const [addressText, setAddressText] = useState(initialData?.address ?? "");
  const [cityPending, setCityPending] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: initialData ?? { priceUnit: "PER_SERVICE" },
  });

  const handleAddressSelect = async (s: DadataSuggestion) => {
    const cityName = s.data.city || s.data.settlement || s.data.city_with_type;
    const regionName = s.data.region_with_type || s.data.region;

    if (!cityName) {
      setGeoError("Уточните до конкретного города или населённого пункта — область не подходит");
      setValue("cityId", "", { shouldValidate: false });
      return;
    }
    if (!regionName) {
      setGeoError("Не удалось определить регион. Введите адрес точнее");
      setValue("cityId", "", { shouldValidate: false });
      return;
    }

    setGeoError(null);
    setCityPending(true);
    try {
      const { id } = await ensureCityAction({
        name: cityName,
        fiasId: s.data.city_fias_id || s.data.settlement_fias_id || undefined,
        region: regionName,
      });
      setValue("cityId", id, { shouldValidate: true });
      setValue("address", s.value, { shouldValidate: true });
      setAddressText(s.value);
    } catch (e) {
      const msg = e instanceof Error ? e.message : GEO_LIMIT_MESSAGE;
      setGeoError(msg);
      setValue("cityId", "", { shouldValidate: false });
    } finally {
      setCityPending(false);
    }
  };

  const onSubmit = (data: CreateListingInput) => {
    if (cityPending) return;
    startTransition(async () => {
      if (mode === "edit" && listingId) {
        const result = await updateListingAction({ ...data, id: listingId });
        if (result?.serverError) {
          toast.error(result.serverError);
          return;
        }
        toast.success("Объявление обновлено!");
      } else {
        const result = await createListingAction(data);
        if (result?.serverError) {
          toast.error(result.serverError);
          return;
        }
        toast.success("Объявление создано!");
      }
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
              disabled={isLimited}
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
              disabled={isLimited}
            />
            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Категория *</label>
            <select {...register("categoryId")} className={fieldCls} disabled={isLimited}>
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className={errorCls}>{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Локация (город или адрес) *</label>
            <DadataAddressInput
              value={addressText}
              placeholder="Краснодар, Геленджик, улица..."
              hasError={!!errors.cityId || !!geoError}
              disabled={isLimited}
              onChange={(val) => {
                setAddressText(val);
                setValue("address", val);
                if (!val) {
                  setGeoError(null);
                  setValue("cityId", "", { shouldValidate: false });
                }
              }}
              onSelect={handleAddressSelect}
            />
            {geoError && <p className={errorCls}>{geoError}</p>}
            {!geoError && errors.cityId && (
              <p className={errorCls}>Выберите населённый пункт из подсказок</p>
            )}
            {cityPending && (
              <p className="mt-1 text-xs text-muted-foreground">Определяем город...</p>
            )}
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
              disabled={isLimited}
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
                  disabled={isLimited}
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
                  disabled={isLimited}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || cityPending || isLimited}
        className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
      >
        {isLimited
          ? "Лимит исчерпан"
          : cityPending
            ? "Определяем локацию..."
            : isPending
              ? (mode === "edit" ? "Сохранение..." : "Публикация...")
              : (mode === "edit" ? "Сохранить изменения" : "Опубликовать объявление")}
      </button>
    </form>
  );
}

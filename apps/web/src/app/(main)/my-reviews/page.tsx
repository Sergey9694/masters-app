import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, MessageSquare, Briefcase, ArrowLeft } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { formatSmartDate } from "@/shared/lib/date";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/cn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Мои отзывы — УслугиРядом",
};

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  if (!user.providerProfile) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Briefcase className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Станьте исполнителем</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Отзывы появятся после того, как вы станете исполнителем и завершите первый заказ
          </p>
        </div>
        <Link
          href="/become-provider"
          className="mt-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Начать
        </Link>
      </div>
    );
  }

  const reviews = await db.review.findMany({
    where: { providerId: user.providerProfile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      text: true,
      createdAt: true,
      author: {
        select: { firstName: true, lastName: true, avatar: true },
      },
      order: {
        select: { id: true, title: true, slug: true, category: { select: { slug: true } } },
      },
    },
  });

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          К профилю
        </Link>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Мои отзывы</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviews.length > 0
                ? `${reviews.length} ${pluralReview(reviews.length)}`
                : "Пока нет отзывов"}
            </p>
          </div>
          {avg && (
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold">{avg}</span>
            </div>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-6" />
          </span>
          <div>
            <p className="text-base font-semibold">Отзывов пока нет</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Завершайте заказы качественно — клиенты оставят оценки
            </p>
          </div>
          <Link
            href="/orders"
            className="mt-2 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Открыть ленту заказов
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => {
            const orderHref =
              review.order.category?.slug && review.order.slug
                ? `/orders/${review.order.category.slug}/${review.order.slug}`
                : `/orders`;

            return (
              <div
                key={review.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar size="default">
                      <AvatarImage src={review.author.avatar ?? ""} alt={review.author.firstName} />
                      <AvatarFallback className="font-semibold uppercase">
                        {review.author.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {review.author.firstName}
                        {review.author.lastName ? ` ${review.author.lastName[0]}.` : ""}
                      </p>
                      <div className="mt-0.5 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-3",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatSmartDate(review.createdAt)}
                  </span>
                </div>

                {review.text && (
                  <p className="text-sm italic text-foreground/80">«{review.text}»</p>
                )}

                <Link
                  href={orderHref}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Briefcase className="size-3 shrink-0" />
                  <span className="truncate">{review.order.title}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function pluralReview(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return "отзывов";
  if (last === 1) return "отзыв";
  if (last >= 2 && last <= 4) return "отзыва";
  return "отзывов";
}

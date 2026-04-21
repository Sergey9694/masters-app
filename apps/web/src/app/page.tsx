import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/shared/lib/get-user";
import { Container } from "@/shared/ui/container";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

import { Header } from "@/widgets/Header";
import { Footer } from "@/widgets/Footer";
import { HeroSection } from "@/widgets/HeroSection";
import { PopularCategories } from "@/widgets/PopularCategories";
import { HowItWorks } from "@/widgets/HowItWorks";
import { TopProviders } from "@/widgets/TopProviders";

/**
 * Главная страница (лендинг).
 * Для авторизованных — редирект в ленту заказов.
 * Для гостей — лендинг с Hero, категориями, шагами и топ-исполнителями.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard/feed");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Container size="2xl">
          <HeroSection />
          <PopularCategories />
          <HowItWorks />
          <TopProviders />

          <section className="my-16 rounded-xl border border-border/60 bg-surface p-8 text-center lg:my-20 lg:p-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Готовы начать?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
              Зарегистрируйтесь бесплатно и найдите исполнителя или клиентов за несколько минут.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "group gap-2")}
              >
                Зарегистрироваться
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/dashboard/feed"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Посмотреть заказы
              </Link>
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

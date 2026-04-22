import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

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
 * Авторизованных — редирект в ленту заказов.
 * Гостям — лендинг: Hero → Категории → Как работает → Топ исполнителей → CTA.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/orders");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero — decorative gradient background */}
        <HeroSection />

        {/* Категории — на основном фоне */}
        <PopularCategories />

        {/* Как работает — чередующийся bg-muted/40 */}
        <HowItWorks />

        {/* Топ исполнители — снова основной фон */}
        <TopProviders />

        {/* CTA — primary-градиент */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary via-primary to-primary/80 py-20 lg:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)",
            }}
          />

          <Container size="2xl" className="relative">
            <div className="mx-auto max-w-2xl text-center text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                Начните бесплатно
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Готовы решить свою задачу?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base opacity-90 sm:text-lg">
                Зарегистрируйтесь за минуту и получите первые предложения уже сегодня.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group gap-2 bg-white text-primary shadow-xl hover:bg-white/95"
                  )}
                >
                  Зарегистрироваться
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/orders"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  )}
                >
                  Посмотреть заказы
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

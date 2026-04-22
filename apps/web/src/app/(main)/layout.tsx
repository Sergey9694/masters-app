import { Header } from "@/widgets/Header";
import { Sidebar } from "@/widgets/Sidebar";
import { Footer } from "@/widgets/Footer";
import { BottomNav } from "@/widgets/BottomNav";
import { Container } from "@/shared/ui/container";

/**
 * Основной layout приложения (Фаза 5).
 * Десктоп: Header + Sidebar + content + Footer.
 * Мобильный: Header + content + BottomNav (sidebar скрыт, footer не показываем
 * чтобы BottomNav не пересекался с футером).
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Container size="2xl" className="py-6 lg:py-10">
            {children}
          </Container>
        </main>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}

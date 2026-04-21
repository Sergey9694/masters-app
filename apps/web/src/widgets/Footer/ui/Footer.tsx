import Link from "next/link";
import { Container } from "@/shared/ui/container";

interface FooterSection {
  title: string;
  links: { href: string; label: string }[];
}

const SECTIONS: FooterSection[] = [
  {
    title: "Сервис",
    links: [
      { href: "/about", label: "О проекте" },
      { href: "/how-it-works", label: "Как это работает" },
      { href: "/pricing", label: "Тарифы" },
    ],
  },
  {
    title: "Поддержка",
    links: [
      { href: "/help", label: "Помощь" },
      { href: "/contacts", label: "Контакты" },
      { href: "/report", label: "Сообщить о проблеме" },
    ],
  },
  {
    title: "Правовое",
    links: [
      { href: "/terms", label: "Условия использования" },
      { href: "/privacy", label: "Политика конфиденциальности" },
      { href: "/rules", label: "Правила площадки" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/30">
      <Container size="2xl" className="py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold">УслугиРядом</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Доска услуг в вашем городе — найдите исполнителя или предложите свои навыки.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-semibold">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} УслугиРядом. Все права защищены.</span>
          <span>Сделано с любовью к местным мастерам</span>
        </div>
      </Container>
    </footer>
  );
}

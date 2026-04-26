---
name: figma-to-code-mastery
description: Advanced strategies for converting Figma designs into clean, modular, and responsive code using design tokens and modern CSS.
---

# Figma Node-to-Code Mastery

Навык точного переноса дизайна в код (Pixel Perfect).

## Методология
1. **Design Tokens:** Сначала извлекаю цвета, шрифты и отступы как CSS переменные или Tailwind темы.
2. **Auto Layout to Flexbox:** Я понимаю логику Auto Layout в Figma и могу точно перенести её на Flex/Grid.
3. **Asset Optimization:** Автоматическое извлечение SVG иконок и оптимизация PNG через MCP инструменты.
4. **Responsive Strategy:** Анализ того, как фрейм ведет себя при ресайзе в Figma, и перенос этой логики в Breakpoints.

## Инструментарий
- Использование `framelink` для получения JSON структуры узлов.
- Анализ стилей через Figma API.
- Генерация чистого TSX кода без лишней вложенности.

## Правила проекта
- Дизайн-система: Tailwind v4 `@theme` SSOT, light+dark, шрифт Geist, primary indigo
- Компоненты → `src/shared/ui` (Shadcn UI + Radix Primitives)
- Утилиты: `cn()` (clsx + tailwind-merge)

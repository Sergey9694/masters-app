---
name: shadcn-ui-mastery
description: Expert knowledge for building high-quality, accessible UI components using Shadcn UI, Radix Primitives, and Tailwind CSS.
---

# Shadcn UI & Radix Mastery

Этот навык делает меня экспертом в создании современных интерфейсов.

## Принципы
1. **Accessibility First:** Всегда проверяй `aria-*` атрибуты и фокус-менеджмент.
2. **Composition:** Используй паттерн "Slot" и композицию компонентов вместо гигантских пропс-листов.
3. **Tailwind Best Practices:** Используй `cn()` для слияния классов. Избегай хардкода цветов, используй CSS переменные темы.

## Процесс создания компонента
- Найти подходящий примитив в Radix.
- Стилизовать его согласно дизайн-системе проекта.
- Вынести переиспользуемые части в `src/shared/ui`.
- Добавить поддержку `ref` через `React.forwardRef`.

## Правила проекта
- Дизайн-система: Tailwind v4 `@theme` SSOT, light+dark
- Базовые компоненты → `apps/web/src/shared/ui`
- Стилистические изменения — централизованно в файле компонента

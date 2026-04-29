# План внедрения Trust System (Жалобы и Блокировки)

Этот документ описывает архитектуру и шаги внедрения системы пользовательской безопасности и модерации в приложении «УслугиРядом».

---

## 🎯 Цели
1. **Защита пользователей**: Дать возможность мгновенно прекратить общение с нежелательным собеседником.
2. **Модерация контента**: Создать механизм подачи жалоб для очистки платформы от спама и мошенников.
3. **Enterprise Security**: Обеспечить неизменяемость доказательств (snapshot сообщений) при подаче жалоб.

---

## 🛠 Технический стек
- **Database**: Prisma (PostgreSQL)
- **Validation**: Zod
- **Real-time**: Socket.io (для мгновенного применения блокировок)
- **UI**: Shadcn UI + Framer Motion

---

## 🏗 Фаза 1: Модель данных (Database Layer)

Необходимо добавить две новые модели в `schema.prisma`:

### 1.1 Блокировки (`UserBlock`)
Позволяет пользователю А заблокировать пользователя Б.
```prisma
model UserBlock {
  id        String   @id @default(cuid())
  blockerId String
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id])
  blockedId String
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id])
  
  reason    String?  // Опциональный комментарий для себя
  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
}
```

### 1.2 Жалобы (`Report`)
Официальное обращение к модератору.
```prisma
enum ReportReason {
  SPAM
  HARASSMENT
  FRAUD
  INAPPROPRIATE_CONTENT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  REJECTED
}

model Report {
  id          String   @id @default(cuid())
  reporterId  String
  reporter    User     @relation("Reporter", fields: [reporterId], references: [id])
  targetId    String
  targetUser  User     @relation("ReportTarget", fields: [targetId], references: [id])
  
  conversationId String?
  reason      ReportReason
  description String?
  evidence    Json?      // Снапшот последних сообщений
  
  status      ReportStatus @default(PENDING)
  adminNotes  String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([targetId])
  @@index([status])
}
```

---

## ⚙️ Фаза 2: Бизнес-логика (Service Layer)

### 2.1 `TrustService`
Создание нового сервиса `src/services/trust.service.ts`:
- `blockUser(blockerId, blockedId)`
- `unblockUser(blockerId, blockedId)`
- `isBlocked(userId, targetId)` — проверка в обе стороны.
- `createReport(data)` — создание жалобы + автоматический сбор последних 10 сообщений диалога для доказательств.

### 2.2 Интеграция в ChatService
- Обновление `sendMessage`: перед сохранением сообщения проверяем, не заблокирован ли отправитель получателем.
- Обновление `getConversations`: помечаем заблокированные чаты или скрываем их по фильтру.

---

## 🚀 Фаза 3: Server Actions (FSD: Features)

Создание новых действий в `src/features/chat/api/`:
1. `blockUserAction`: вызывает сервис + шлет сокет-событие `user:blocked`.
2. `reportUserAction`: валидация через Zod + создание записи в БД.

---

## 🎨 Фаза 4: Интерфейс (UI Layer)

### 4.1 Компоненты
- **ReportModal**: Диалоговое окно с выбором причины и текстовым полем.
- **BlockButton**: Кнопка в хедере чата с подтверждением действия.
- **BlockedState**: Заглушка вместо поля ввода сообщения в заблокированном чате ("Вы не можете отправлять сообщения этому пользователю").

### 4.2 Улучшение ChatWindow
- Добавление выпадающего меню (Dropdown) в `ConversationHeader` с пунктами "Пожаловаться" и "Заблокировать".

---

## 🛡 Фаза 5: Безопасность и Модерация

1. **Rate Limiting**: Ограничение на количество жалоб в час (защита от спама жалобами).
2. **Admin Dashboard**: (Будущий этап) Интерфейс для просмотра списка `PENDING` отчетов и принятия мер (бан аккаунта, предупреждение).

---

## 📋 План выполнения (Roadmap)

1. [ ] **Step 1**: Обновить `schema.prisma`, запустить `npx prisma migrate dev`.
2. [ ] **Step 2**: Реализовать `trust.service.ts` и тесты к нему.
3. [ ] **Step 3**: Создать Server Actions.
4. [ ] **Step 4**: Добавить логику проверки блокировки в `sendMessage`.
5. [ ] **Step 5**: Сверстать `ReportModal` и обновить `ConversationHeader`.
6. [ ] **Step 6**: Протестировать сценарий: Пользователь А блокирует Б → Б получает ошибку при попытке написать.

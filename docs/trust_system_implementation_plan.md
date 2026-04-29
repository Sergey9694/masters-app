# План внедрения Trust/Safety System (жалобы, блокировки, модерация)

Этот документ описывает целевую архитектуру слоя пользовательской безопасности в
«УслугиРядом». Trust/Safety должен быть отдельным модулем платформы, а не частью
чата: чат, заказы, объявления, отзывы и профили только обращаются к нему.

---

## Цели

1. **Защита пользователей**: дать пользователю возможность прекратить нежелательное общение.
2. **Модерация платформы**: принимать жалобы не только на пользователей, но и на сообщения, заказы, объявления, отзывы и профили.
3. **Доказательная база**: сохранять неизменяемый snapshot контекста жалобы без ослабления текущего шифрования сообщений.
4. **Антифрод-фундамент**: подготовить основу для рангов исполнителей, автомодерации контактов и будущего диспут-центра.

---

## Текущий контекст проекта

- Чат уже хранит текст сообщений зашифрованным через AES-256-GCM at-rest.
- В `User.chatBlockedAt` уже есть глобальная админская блокировка чата.
- В `socket-events.ts` уже зарезервировано событие `user:blocked`, но его нужно типизировать с payload.
- В админке уже есть просмотр чатов, soft-delete сообщений и CSV-экспорт.
- В `DEVELOPMENT_PLAN.md` есть более широкая задача 11.5.4: универсальные жалобы и модерация чата.

Вывод: личные блокировки пользователей (`UserBlock`) нельзя смешивать с админской
блокировкой чата (`chatBlockedAt`). Это разные механики и разные причины.

---

## Принципы реализации

- **Trust/Safety как отдельный слой**: сервисы и actions живут в `trust`, чат только вызывает проверки.
- **Server enforcement first**: UI может прятать поле ввода, но запрет отправки обязан быть в `chatService.sendMessage`.
- **Универсальные жалобы**: `Report` должен поддерживать разные типы целей через `targetType + targetId`.
- **Evidence без plaintext**: в snapshot сообщений не кладем расшифрованный текст; храним encrypted text, hash и метаданные.
- **Аудит решений**: любые действия модератора фиксируются через `AuditLog`.
- **Минимум зависимостей**: новая библиотека для MVP не нужна, достаточно Prisma, Zod, Socket.io и текущих UI-примитивов.

---

## Фаза 1: Модель данных

### 1.1 Личные блокировки (`UserBlock`)

Пользователь А блокирует пользователя Б. Блокировка работает в обе стороны для
отправки сообщений: ни одна сторона не должна продолжить переписку, пока блок активен.

```prisma
model UserBlock {
  id        String   @id @default(cuid())
  blockerId String
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id])
  blockedId String
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id])

  conversationId String?
  reason         String?
  createdAt      DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
  @@index([conversationId])
}
```

Unblock для MVP может удалять запись. Историю действия фиксировать через `AuditLog`.

### 1.2 Универсальные жалобы (`Report`)

Жалоба должна уметь ссылаться на разные сущности: пользователя, сообщение, диалог,
заказ, объявление, отзыв или профиль исполнителя.

```prisma
enum ReportTargetType {
  USER
  MESSAGE
  CONVERSATION
  ORDER
  LISTING
  REVIEW
  PROVIDER
}

enum ReportReason {
  SPAM
  HARASSMENT
  FRAUD
  INAPPROPRIATE_CONTENT
  CONTACT_EXCHANGE
  SAFETY_THREAT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACTIONED
  DISMISSED
}

model Report {
  id          String @id @default(cuid())
  reporterId  String
  reporter    User   @relation("Reporter", fields: [reporterId], references: [id])

  targetType   ReportTargetType
  targetId     String
  targetUserId String?
  targetUser   User?  @relation("ReportTargetUser", fields: [targetUserId], references: [id])

  conversationId String?
  messageId      String?
  orderId        String?

  reason      ReportReason
  description String?
  evidence    Json?

  status      ReportStatus @default(PENDING)
  adminNotes  String?
  actionTaken String?
  resolvedAt  DateTime?
  resolvedById String?
  resolvedBy   User?  @relation("ReportResolver", fields: [resolvedById], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status, createdAt])
  @@index([reporterId, createdAt])
  @@index([targetType, targetId])
  @@index([targetUserId])
  @@index([conversationId])
}
```

В `User` нужно добавить обратные связи:

```prisma
blocksCreated   UserBlock[] @relation("Blocker")
blocksReceived  UserBlock[] @relation("Blocked")
reportsCreated  Report[]    @relation("Reporter")
reportsReceived Report[]    @relation("ReportTargetUser")
reportsResolved Report[]    @relation("ReportResolver")
```

### 1.3 Evidence snapshot

Для жалоб по чату snapshot последних сообщений должен быть структурированным:

```ts
type ReportEvidence = {
  version: 1;
  conversationId?: string;
  reportedMessageId?: string;
  messages?: Array<{
    id: string;
    senderId: string;
    createdAt: string;
    encryptedText: string;
    textHash: string;
    attachments: string[];
    deletedAt: string | null;
  }>;
  context?: {
    orderId?: string | null;
    listingId?: string | null;
  };
};
```

Важно: `encryptedText` можно расшифровать только серверным кодом с `ENCRYPTION_KEY`.
В админке показывать evidence следует через отдельный admin-only сервис.

---

## Фаза 2: Service Layer

Создать `apps/web/src/services/trust.service.ts`.

### 2.1 Пользовательские блокировки

- `blockUser(blockerId, blockedId, options?)`
- `unblockUser(blockerId, blockedId)`
- `getBlockState(userId, targetUserId)` -> `{ blockedByMe, blockedMe }`
- `assertCanMessage(conversationId, senderId)` -> бросает понятную ошибку, если есть блокировка или `chatBlockedAt`

`assertCanMessage` должен использоваться в `chatService.sendMessage`.

### 2.2 Жалобы

- `createReport(data)` — валидирует цель, создает жалобу, собирает evidence.
- `listReports(filters, pagination)` — для админки.
- `resolveReport(reportId, adminId, decision)` — переводит в `ACTIONED` или `DISMISSED`, пишет `AuditLog`.

### 2.3 Интеграция с ChatService

- `startConversation`: не создавать новый диалог, если между пользователями активная блокировка.
- `sendMessage`: перед созданием сообщения вызвать `trustService.assertCanMessage`.
- `getConversations`: вернуть `blockState` для UI или пометку `isBlocked`.
- `getUnreadCount`: не считать сообщения из скрытых/заблокированных диалогов только если продуктово решим скрывать такие диалоги.

---

## Фаза 3: Server Actions и события

Создать отдельный feature-модуль:

```text
apps/web/src/features/trust/
├── api/actions.ts
├── model/schema.ts
├── ui/ReportModal.tsx
├── ui/BlockUserButton.tsx
└── ui/BlockedState.tsx
```

Actions:

1. `blockUserAction` — вызывает `trustService.blockUser`, отправляет socket-события.
2. `unblockUserAction` — снимает блокировку.
3. `reportTargetAction` — создает жалобу с rate-limit.
4. `resolveReportAction` — admin-only action для очереди жалоб.

Socket event:

```ts
"user:blocked": (data: {
  blockerId: string;
  blockedId: string;
  conversationId?: string;
}) => void;
```

После блокировки нужно отправить:
- `user:blocked` в комнаты `user:{blockerId}` и `user:{blockedId}`;
- `conversation:update` для обновления счетчиков и состояния списка диалогов.

---

## Фаза 4: UI

### 4.1 Чат

- В `ConversationHeader` добавить меню с действиями:
  - «Пожаловаться»
  - «Заблокировать»
  - «Разблокировать» при активной блокировке мной
- В `ChatWindow` слушать `user:blocked` и менять локальный `blockState`.
- Вместо `MessageInput` показывать `BlockedState`, если диалог заблокирован.
- Ошибка `sendMessageAction` при блокировке должна возвращать человеческий текст.

### 4.2 Универсальные точки жалобы

После MVP чата те же `ReportModal` и `reportTargetAction` использовать на:
- карточке заказа;
- объявлении исполнителя;
- профиле исполнителя;
- отзыве;
- конкретном сообщении.

### 4.3 Админка

Создать `/admin/reports`:
- список `PENDING` жалоб;
- фильтры по статусу, причине, типу цели;
- карточка evidence;
- действия: `reviewed`, `dismissed`, `actioned`;
- быстрые переходы к чату, пользователю, заказу, объявлению.

---

## Фаза 5: Безопасность и модерация

1. **Rate-limit жалоб**: например, 5 жалоб в час на пользователя.
2. **Защита от саможалоб/самоблокировок**: `blockerId !== blockedId`, `reporterId` не должен жаловаться на самого себя без явной причины.
3. **Контактный антифрод (MVP)**: regex-детект телефонов, email и Telegram-ссылок в `sendMessage`.
4. **Admin escalation**: при повторных жалобах на пользователя показывать флаг в `/admin/users`.
5. **Provider level readiness**: количество подтвержденных жалоб использовать в будущей логике рангов исполнителей.

---

## Roadmap внедрения

1. [ ] Согласовать схему БД: `UserBlock`, `Report`, enums, связи в `User`.
2. [ ] Создать миграцию через `npx prisma migrate dev --name add_trust_safety`.
3. [ ] Реализовать `trust.service.ts` и unit-тесты.
4. [ ] Подключить `assertCanMessage` в `chatService.sendMessage`.
5. [ ] Добавить `blockState` в DTO диалога или отдельный loader для `ChatWindow`.
6. [ ] Создать actions в `features/trust/api/actions.ts`.
7. [ ] Добавить `ReportModal`, `BlockUserButton`, `BlockedState`.
8. [ ] Обновить `ConversationHeader` и `ChatWindow`.
9. [ ] Создать `/admin/reports`.
10. [ ] Добавить E2E: пользователь А блокирует Б -> Б не может написать.
11. [ ] Добавить E2E: жалоба на сообщение попадает в `/admin/reports` с evidence.

---

## Рекомендация по MVP

Лучший стартовый объем:

1. Личные блокировки в чате.
2. Жалоба на пользователя/сообщение из чата.
3. Evidence последних 10 сообщений без plaintext.
4. Минимальная админ-очередь `/admin/reports`.

Это даст реальную защиту пользователей и не распылит задачу на все поверхности
платформы сразу. После этого можно расширять `ReportTargetType` на заказы,
объявления, отзывы и профили без смены архитектуры.

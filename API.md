# Backend API

Базовий URL (локально): `http://localhost:5122`

`userId` — рядок (для Telegram це Telegram user id). Усі запити, крім логіну й heartbeat, потребують заголовок `X-Session-Id`.

У Development з локального комп'ютера доступні `POST /api/admin/reset-box-timer`,
`POST /api/admin/reset-tree-watering-timer` і `POST /api/admin/advance-tree-stage`.
Усі приймають `{"userId":"123456789"}` та активний `X-Session-Id` цього користувача.
Перші два записують `0` лише у відповідний timestamp. Третій підвищує
`wateredTimesAmount` до порога наступної стадії (максимум 10), не змінюючи таймер
поливу, і повертає `{"wateredTimesAmount":1,"stage":2}`. Використовуються в Unity
через `Tools → Dev Console` під час Play Mode.
## 0. Логін і сесія

Одночасно на акаунті може бути активна лише одна сесія. Сесія діє 90 секунд після останнього heartbeat
(налаштовується через `Sessions:LifetimeSeconds`) і зберігається в пам'яті бекенду, тож після його перезапуску втрачається.

### POST `/api/users/login`

Тіло: `userId`, `username`, `initData` (рядок `Telegram.WebApp.initData` як є), `deviceId` (стабільний id пристрою).

```bash
curl -X POST http://localhost:5122/api/users/login -H "Content-Type: application/json" -d '{"userId":"123456789","username":"artab","initData":"query_id=...&user=...&auth_date=...&hash=...","deviceId":"device-A"}'
```

Відповідь `200`:

```json
{"userId":"123456789","sessionId":"3f2a...","heartbeatIntervalSeconds":30}
```

Бекенд перевіряє підпис `initData` токеном бота, термін дії (`auth_date` не старший за 24 години) і те, що `userId`
збігається з користувачем у `initData`. Повторний логін з того самого пристрою видає нову сесію.

| Код | Коли |
|---|---|
| 400 | Немає `userId`, `deviceId` або `initData` |
| 401 | Підпис `initData` недійсний, пошкоджений або застарів |
| 403 | `userId` не збігається з користувачем в `initData` |
| 409 | Акаунт активний на іншому пристрої |
| 503 | Firebase або токен бота не налаштовані |

### POST `/api/users/session/heartbeat`

Продовжує сесію. Викликати з інтервалом `heartbeatIntervalSeconds`.

```bash
curl -X POST http://localhost:5122/api/users/session/heartbeat -H "Content-Type: application/json" -d '{"sessionId":"3f2a..."}'
```

Відповідь `200`:

```json
{"sessionId":"3f2a...","heartbeatIntervalSeconds":30}
```

| Код | Коли |
|---|---|
| 400 | Немає `sessionId` |
| 404 | Сесію не знайдено (невідомий id, або бекенд перезапускався) |
| 409 | Акаунт активний на іншому пристрої |

## 1. GetUsername

Повертає Telegram-username користувача за його Telegram id. Username зберігається в `Users/{id}.telegramUsername` при логіні, тож для гравця, який ще не заходив або не має username, відповідь `404`. Потрібен `X-Session-Id`; у query `userId` — id того, хто питає (власник сесії).

```bash
curl "http://localhost:5122/api/users/username/987654321?userId=123456789" -H "X-Session-Id: <sessionId>"
```

Відповідь `200`:

```json
{"userId":"987654321","username":"some_user"}
```

## 2. Чат

Один спільний чат для всіх гравців, колекція `ChatMessages`. Обидва запити потребують `X-Session-Id`. Дату відправки ставить сервер (Unix seconds, UTC).

### POST `/api/chat/message`

Текст обрізається по краях і має містити 1–500 символів, інакше `400`.

```bash
curl -X POST http://localhost:5122/api/chat/message -H "Content-Type: application/json" -H "X-Session-Id: <sessionId>" -d '{"userId":"123456789","message":"Привіт"}'
```

Відповідь `200`:

```json
{"userId":"123456789","message":"Привіт","sentAtUnixSeconds":1793560000}
```

### GET `/api/chat/messages/{userId}?limit=50`

Повертає останні повідомлення, найстаріші першими. `limit` типово 50, максимум 100.

```bash
curl "http://localhost:5122/api/chat/messages/123456789?limit=50" -H "X-Session-Id: <sessionId>"
```

Відповідь `200`:

```json
[{"userId":"123456789","message":"Привіт","sentAtUnixSeconds":1793560000}]
```

### WebSocket `/api/chat/ws?userId=...&sessionId=...`

Сервер розсилає кожне нове повідомлення всім підключеним (формат як у `POST`). Клієнт лише отримує; надсилати треба через `POST`. Сесія передається в query (браузер не вміє ставити заголовки на WebSocket); недійсна сесія при підключенні дає `401`. Сервер кожні 5 с перевіряє сесію й закриває сокет кодом `1008` (`session expired`), якщо вона втрачена. Чат зберігає не більше 100 повідомлень і нічого старшого за 3 доби. Деталі, правила перепідключення й `.jslib`-плагін для Unity: `Assets/Backend/Chat_API.md` у Unity-проєкті.


## 3. Монети

### POST `/api/coins/change`

Змінює баланс монет (`Users/{userId}.coins`). `amount` — ціле число, додатне або від'ємне. Додатний `amount` також збільшує `Users/{userId}.globalCoins` — загальну кількість зібраних монет; при відніманні `globalCoins` не зменшується. Якщо баланс став би від'ємним, відповідь `400` і баланс не змінюється. Потрібен `X-Session-Id`.

```bash
curl -X POST http://localhost:5122/api/coins/change -H "Content-Type: application/json" -H "X-Session-Id: <sessionId>" -d '{"userId":"123456789","amount":-40}'
```

Відповідь `200`:

```json
{"userId":"123456789","coinsAmount":60}
```

## 4. Прикраси

### POST `/api/decorations/add`

Додає прикрасу користувачу: `Users/{userId}/Decorations/{decorationId}`. Повторне додавання тієї самої прикраси нічого не змінює. `decorationId` не може бути від'ємним (`400`). Потрібен `X-Session-Id`.

```bash
curl -X POST http://localhost:5122/api/decorations/add -H "Content-Type: application/json" -H "X-Session-Id: <sessionId>" -d '{"userId":"123456789","decorationId":7}'
```

Відповідь `200`:

```json
{"userId":"123456789","decorationId":7}
```

## 5. Усі дані користувача

### GET `/api/users/data/{userId}`

Повертає поля документа користувача (`fields`) і всі його підколекції (`collections`: назва колекції → id документа → поля). Дати — рядки ISO 8601. Потрібен `X-Session-Id`.

```bash
curl http://localhost:5122/api/users/data/123456789 -H "X-Session-Id: <sessionId>"
```

Відповідь `200`:

```json
{"userId":"123456789","fields":{"telegramUsername":"artab","lastLoginAt":"2026-11-05T21:44:52+00:00","coins":60},"collections":{"Decorations":{"7":{"decorationId":7}}}}
```

## 6. Коробка

Дата відкриття зберігається в `Users/{userId}.boxOpenedAtUnixSeconds` (Unix seconds, UTC). Обидва запити потребують `X-Session-Id`.

### POST `/api/box/set-opened`

Записує поточний серверний час як час відкриття коробки.

```bash
curl -X POST http://localhost:5122/api/box/set-opened -H "Content-Type: application/json" -H "X-Session-Id: <sessionId>" -d '{"userId":"123456789"}'
```

Відповідь `200`:

```json
{"userId":"123456789","boxOpenedAtUnixSeconds":1794222980}
```

### GET `/api/box/remaining-time/{userId}`

Повертає час, що залишився до наступного відкриття: `відкрито + Box:CooldownSeconds (типово 86400, тобто 24 год) − зараз`. Якщо результат від'ємний або коробку ще не відкривали, всі поля нулі.

```bash
curl http://localhost:5122/api/box/remaining-time/123456789 -H "X-Session-Id: <sessionId>"
```

Відповідь `200`:

```json
{"remainingSeconds":3600,"days":0,"hours":1,"minutes":0,"seconds":0,"boxOpenedAtUnixSeconds":1794222980,"serverNowUnixSeconds":1794222980}
```

## 7. Полив ялинки

Те саме, що й коробка, але для поливу: час зберігається в `Users/{userId}.treeWateredAtUnixSeconds`. Обидва запити потребують `X-Session-Id`.

### POST `/api/tree/set-watered`

Записує поточний серверний час як час поливу й збільшує на 1 лічильник `wateredTimesAmount` у даних користувача (одним атомарним записом).

```bash
curl -X POST http://localhost:5122/api/tree/set-watered -H "Content-Type: application/json" -H "X-Session-Id: <sessionId>" -d '{"userId":"123456789"}'
```

Відповідь `200`: `{"userId":"123456789","treeWateredAtUnixSeconds":1794222980,"wateredTimesAmount":5}`

### GET `/api/tree/watering-remaining-time/{userId}`

Повертає час до наступного поливу: `полито + Tree:WateringCooldownSeconds (типово 21600, тобто 6 год) − зараз`. Від'ємний результат або ялинка, яку ще не поливали, дають нулі. Формат відповіді як у коробки, з полем `treeWateredAtUnixSeconds`.

```bash
curl http://localhost:5122/api/tree/watering-remaining-time/123456789 -H "X-Session-Id: <sessionId>"
```

### GET `/api/tree/watered-times/{userId}`

Повертає, скільки разів полили ялинку (`Users/{userId}.wateredTimesAmount`); `0`, якщо ще не поливали. Потрібен `X-Session-Id`.

```bash
curl http://localhost:5122/api/tree/watered-times/123456789 -H "X-Session-Id: <sessionId>"
```

Відповідь `200`: `{"userId":"123456789","wateredTimesAmount":5}`

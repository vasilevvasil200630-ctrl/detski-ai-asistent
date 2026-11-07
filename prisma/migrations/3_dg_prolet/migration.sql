-- Облакът принадлежи на ДГ „Пролет“, с. Ягодово (src/config/kindergarten.ts).
-- Създава градината, ако я няма. Кодът за присъединяване е случаен; първият регистриран
-- профил става администратор и вижда кода в „Учителски хъб“.
INSERT INTO "Kindergarten" ("id", "name", "city", "motto", "joinCode", "createdAt", "updatedAt")
VALUES (
  'dg-prolet',
  'ДГ „Пролет“',
  'с. Ягодово',
  '',
  'ДГ-' || upper(substr(translate(md5(random()::text || clock_timestamp()::text), '01', 'XY'), 1, 6)),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

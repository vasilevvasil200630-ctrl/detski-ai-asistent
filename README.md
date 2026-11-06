# 🪄 Детски AI Асистент: Магическа кутия с игри & Учителски хъб

Платформа за учителите в детската градина: ситуационни игри за 30 секунди, ДОС план-конспект
за 10 секунди, златни промптове и **обща банка с игри за целия учителски екип**.

Основата (стек, рамка на интерфейса, вход, AI на сървъра, база данни) е копирана от работещия
проект **МатураПлюс** и адаптирана за детската градина с топла палитра.

## Функционалности

- **🎲 Магическа кутия с игри** (`/games`) — настроение, място, време и ресурси → 3 игри с римуван
  стих, стъпки, умения по Наредба № 5 и адаптация за дете със СОП.
- **🚀 ДОС план за 10 сек** (`/dos`) — план-конспект, авторска приказка и бележка за родителите.
- **📚 Златни промптове** (`/prompts`) — готови промптове с QR код за залата.
- **🏛️ Учителски хъб** (`/hub`) — регистрация на детска градина, код за колеги, екип и
  колективна банка с игри (харесвания, филтри, собствени игри).
- **🛡️ Вграден демо двигател** — без AI ключ или при грешка/забавяне сайтът връща демо игри,
  така че демонстрацията пред публика никога не „увисва“.

## Технически стек (както в МатураПлюс)

- Next.js 16 (App Router) + React 19, TypeScript
- Prisma 7 + PostgreSQL (Supabase), клиент в `src/generated`
- Вход с имейл и парола: bcryptjs + jose (JWT бисквитка), Zod валидация, лимит на опитите
- Google Gemini на сървъра (`@google/genai`) с повторни опити, резервни модели и краен срок
- Upstash Redis за лимит на заявките (по желание; без него — в паметта)
- Tailwind CSS v4, zustand, lucide-react

## Локално стартиране

```bash
npm install
cp .env.example .env.local   # попълни SESSION_SECRET (и GEMINI_API_KEY по желание)
npm run db:dev               # локален Postgres (PGlite); копирай TCP адреса в DATABASE_URL
npm run db:migrate:deploy    # създава таблиците
npm run dev                  # http://localhost:3000
```

С `npm run db:dev` сложи `DATABASE_POOL_MAX="1"` в `.env.local`.

## База данни (миграции)

Схемата е в `prisma/schema.prisma`, историята — в `prisma/migrations/`. Не ползвай
`prisma db push` / `prisma migrate dev` срещу живата база.

Промяна: редактирай `schema.prisma` → `npm run db:migrate:diff` → запиши изхода в
`prisma/migrations/<YYYYMMDDHHMM>_<име>/migration.sql` → прегледай → commit →
`npm run db:migrate:deploy`.

## Deploy (Vercel)

Проектът във Vercel е `detski-ai-asistent-s56y`, свързан с GitHub репото.

- Качване: `git push vercel` — качва текущия клон със същото име; `main` → production,
  всеки друг клон → preview адрес.
- База: Neon Postgres (Vercel → Storage), която сама добавя `DATABASE_URL` и
  `DATABASE_URL_UNPOOLED`.
- Миграциите се пускат на Vercel при всеки build (`npm run vercel-build` →
  `prisma migrate deploy` през директната връзка `DATABASE_URL_UNPOOLED`).
- Environment Variables: `SESSION_SECRET` (зададен), `GEMINI_API_KEY` (без него — демо
  двигател), по желание `UPSTASH_REDIS_REST_URL` / `_TOKEN`.
- GitHub Actions пуска build и проверка на типовете.

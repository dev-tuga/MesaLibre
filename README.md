# MesaLibre

Pay-at-table platform for restaurants: guests scan a QR code on their table, browse the digital
menu, add items to a shared bill, split the payment between friends (with tip), and leave a review
— all from their phone, no app install required. Restaurant staff manage the menu, open tables and
payment history from an admin dashboard.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- TypeScript (strict mode)
- PostgreSQL 16 + [Prisma ORM](https://www.prisma.io/)
- Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/) for validation at every boundary
- NextAuth (credentials) for the admin panel
- Vitest for unit tests

## Getting started

Requirements: Node 22+, pnpm 10+, Docker (for the local database).

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment variables
cp .env.example .env

# 4. Apply migrations and seed demo data
pnpm db:migrate
pnpm db:seed

# 5. Run the dev server
pnpm dev
```

The app is available at [http://localhost:3000](http://localhost:3000). The seed creates the demo
restaurant **La Picada del Puerto** with 8 tables; the table URLs are printed to the console, e.g.
`/r/la-picada-del-puerto/demo-mesa-1-7f3k`.

## Scripts

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Dev server with Turbopack      |
| `pnpm build`        | Production build               |
| `pnpm lint`         | ESLint                         |
| `pnpm format`       | Format the codebase (Prettier) |
| `pnpm format:check` | Check formatting               |
| `pnpm db:migrate`   | Prisma migrations (dev)        |
| `pnpm db:seed`      | Seed demo data (idempotent)    |
| `pnpm db:studio`    | Prisma Studio                  |

## Architecture

Feature-based structure with thin layers:

```
src/
├── app/
│   ├── (public)/r/[slug]/[table]/   # guest-facing menu & bill
│   ├── (admin)/dashboard/           # restaurant admin panel
│   └── api/
├── features/{menu,orders,payments,feedback}/
│   ├── components/
│   ├── actions/      # server actions: validate (Zod) + orchestrate only
│   ├── services/     # business logic as pure functions, no direct I/O
│   └── schemas/
├── lib/              # prisma singleton, env.ts (Zod), utils
└── components/ui/    # shadcn/ui primitives
```

Ground rules:

- Business logic lives only in `services/` (pure, unit-testable functions).
- Server Components by default; `"use client"` only where there is real interactivity.
- Payments go through a `PaymentProvider` interface (mock implementation today, designed to plug
  in Fintoc/Transbank later).
- Prices are stored in CLP as integers — no decimals, no floats.
- Types are derived from Prisma and `z.infer`, never duplicated by hand.

Design decisions are recorded in [docs/decisions.md](docs/decisions.md).

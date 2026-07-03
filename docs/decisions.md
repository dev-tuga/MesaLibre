# Architecture Decision Records

Short-form ADRs. Newest at the bottom.

---

## ADR-001: Feature-based structure with thin layers

**Status:** accepted

**Context:** The MVP covers four distinct domains (menu, orders, payments, feedback) that will
grow at different speeds. A classic layer-first layout (`controllers/`, `models/`, ...) scatters
each feature across the tree.

**Decision:** Group code by feature under `src/features/*`, each with `components/`, `actions/`,
`services/` and `schemas/`. Server actions only validate input (Zod) and orchestrate; all business
logic lives in `services/` as pure functions so it can be unit-tested without a database.

**Consequences:** Slight ceremony for small features, but every rule about money and order state
ends up in one obvious, testable place.

---

## ADR-002: Prices in CLP as integers

**Status:** accepted

**Context:** The Chilean peso has no decimal subdivision in practice, and floating point math on
money is a known footgun.

**Decision:** All monetary amounts (`priceClp`, `amountClp`, `tipClp`) are stored and computed as
`Int`. Formatting to `$12.990` happens only at the presentation layer.

**Consequences:** Split payments must handle integer division remainders explicitly (covered by
unit tests in the payments service). Supporting other currencies later would require a migration.

---

## ADR-003: Local PostgreSQL via Docker Compose

**Status:** accepted

**Context:** Contributors need a reproducible database without installing PostgreSQL system-wide.

**Decision:** `docker-compose.yml` ships a `postgres:16-alpine` service with credentials matching
`.env.example`, plus a healthcheck so scripts can wait for readiness.

**Consequences:** Docker becomes a dev dependency. Any PostgreSQL 16 instance works as a drop-in
replacement by editing `DATABASE_URL`.

---

## ADR-004: Environment validated with Zod at startup

**Status:** accepted

**Context:** Missing or malformed env vars usually surface as confusing runtime errors deep in the
stack.

**Decision:** `src/lib/env.ts` parses `process.env` with a Zod schema once at module load and
throws a readable error listing what is wrong. Application code imports `env` and never touches
`process.env` directly.

**Consequences:** The schema is the single source of truth for configuration; `.env.example` must
be kept in sync when new variables are added.

---

## ADR-005: Price snapshots on order items and opaque table tokens

**Status:** accepted

**Context:** Two data-model risks: (1) if an order item references only the product, editing a
price in the admin panel would retroactively change bills that are already open; (2) guests reach
their table by URL, and a guessable identifier (e.g. the table number) would let anyone open — and
charge items to — someone else's bill.

**Decision:** `OrderItem` stores `unitPriceClp` copied from the product at the moment it is added.
`Table` carries a unique `qrToken` (random, unrelated to the table number) and every public route
resolves the table by token, never by number. Products referenced by order items cannot be hard
deleted (`onDelete: Restrict`); the admin flow marks them unavailable instead.

**Consequences:** Historic bills are immutable with respect to menu edits. Re-printing QR codes is
the escape hatch if a token leaks. Deleting a product with sales history requires archiving it.

---

## ADR-006: Polling instead of websockets for the shared bill

**Status:** accepted

**Context:** Everyone at a table shares one open order and should see additions from other phones
"in real time". True push (websockets/SSE) adds infrastructure (a stateful server or a third-party
service) that is out of proportion for an MVP where a few seconds of latency is imperceptible in a
restaurant setting.

**Decision:** The bill page mounts a tiny client component that calls `router.refresh()` every 5
seconds; mutations also revalidate the affected paths, so the author of a change sees it
instantly. The rest of the page stays server-rendered.

**Consequences:** Worst-case staleness equals the polling interval and each refresh re-runs the
page query. If the product outgrows this, the `AutoRefresh` component is the single place to swap
in SSE or websockets.

---

## ADR-007: Split semantics — divide what is left, largest part first

**Status:** accepted

**Context:** Splitting a CLP bill in N equal parts rarely divides exactly (CLP is an integer
currency), and payers arrive sequentially: by the time the third friend pays, the balance already
changed. A naive "everyone pays total/N" either loses pesos or double-charges them.

**Decision:** `splitBill(total, parts)` distributes the remainder one peso at a time to the first
parts (e.g. `10000 / 3 -> [3334, 3333, 3333]`). Each payer splits the _remaining_ balance and pays
the largest part (`nextShare`). The tip is computed over the payer's own share — the Chilean
custom — and rounded to the nearest peso. The server always recomputes amounts from the database;
client-side previews are never trusted. Once a payment exists, the bill is frozen (no more
adding/removing items) so the balance cannot shift mid-payment.

**Consequences:** Any sequence of payers closes the bill exactly, with at most $1 of difference
between shares. Unit tests cover exact splits, remainders, sequential payer flows and tip
rounding.

---

## ADR-008: Payments behind a `PaymentProvider` interface

**Status:** accepted

**Context:** The MVP must demonstrate the full pay-at-table flow without moving real money, but
production would use a Chilean rail such as Fintoc or Transbank.

**Decision:** All charging goes through the `PaymentProvider` interface
(`features/payments/providers/payment-provider.ts`): a single `charge()` call returning
approved/rejected. `MockPaymentProvider` simulates latency and always approves well-formed
charges. The active provider is selected by the `PAYMENT_PROVIDER` env var via a factory.

**Consequences:** Integrating a real acquirer is additive: implement the interface, register it in
the factory, set the env var. Server actions, order closing and the UI stay untouched. Webhook
based flows (async confirmation) would extend the interface but not the callers' contract.

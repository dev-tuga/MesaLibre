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

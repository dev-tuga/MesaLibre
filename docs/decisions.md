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

---

## ADR-009: Credentials auth with JWT sessions, scoped by restaurant

**Status:** accepted

**Context:** Only restaurant staff need accounts (guests are anonymous, identified by their
table's QR token). The admin panel must never leak data across restaurants, and the MVP should not
depend on an external identity provider.

**Decision:** NextAuth (v5) with a single Credentials provider over the `AdminUser` table
(bcrypt-hashed passwords) and stateless JWT sessions. The JWT carries `restaurantId`; every admin
query and server action re-reads the session via `getAdminSession()` and filters by that id —
authorization is enforced at the data layer on every call, never only in layouts or middleware.
Destructive menu operations are blocked when history exists (products with sales can only be
marked unavailable).

**Consequences:** No session table or OAuth setup; revoking a session requires rotating
`AUTH_SECRET` or waiting for JWT expiry, acceptable for an MVP. Multi-restaurant support is
already structural: a second restaurant's admin simply sees their own scoped data.

---

## ADR-010: Explicit base URL for generated links instead of request inference

**Status:** accepted

**Context:** QR codes and seeded table links must contain absolute URLs that a _phone_ can reach.
Inferring the host from the incoming request breaks in the common dev scenario: the developer
browses the dashboard at `localhost:3000`, so inferred QR URLs would point the phone at its own
localhost. The URL also has to be known outside any request (seed script).

**Decision:** A single `NEXT_PUBLIC_APP_BASE_URL` env var (Zod-validated, default
`http://localhost:3000`, trailing slashes normalized) is the source of truth for every generated
absolute URL, built through the pure `buildTableUrl()` helper. `pnpm dev:lan` binds the dev server
to `0.0.0.0` so phones on the same network can connect. NextAuth keeps working over the LAN IP
because `trustHost: true` derives auth callback URLs from each request's Host header — no
`AUTH_URL` pinning.

**Consequences:** One env var to flip when demoing on a LAN or deploying behind a domain. If the
var is stale, QR codes point at the wrong host — the README documents the setup steps. Pinning
`AUTH_URL` would break same-app access through two hosts (localhost for the admin, LAN IP for
phones), which is exactly the dev workflow we want.

---

## ADR-011: Server-rendered QR codes with `uqr`

**Status:** accepted

**Context:** The admin panel needs a QR per table and a printable sheet. Client-side generation
(e.g. `qrcode.react`) ships React components and canvas logic to the browser for content that is
completely static per request; heavier libraries (`node-qrcode`) pull in image encoders we don't
need when SVG suffices.

**Decision:** Generate QR codes in Server Components with `uqr` (zero runtime dependencies,
maintained under the unjs umbrella), rendering inline SVG. SVG scales losslessly for print, needs
no `<img>` round-trip and adds zero client-side JavaScript. Error correction level M is enough for
clean on-screen/printed codes. Tokens are regenerated with 12 bytes of `crypto.randomBytes`
(base64url), invalidating the previous QR instantly.

**Consequences:** QR generation cost lives on the server per render — negligible at this scale.
If codes ever need client-side interactivity (e.g. download as PNG), a small client wrapper can
reuse the same URLs.

---

## ADR-012: Waiter-only ordering with guest bill view

**Status:** accepted

**Context:** In a full-service restaurant the guest should not self-order from the digital menu;
the waiter takes the order and the phone only shows the live bill. Split-payment UX also needs a
reliable party size (`headCount`) captured at the table.

**Decision:** Staff add items via `/dashboard/mesas/[tableId]/pedido` (authenticated). Guests
scanning the QR land on `/cuenta` (real-time bill, 5s polling). `Order.headCount` is set by the
waiter when seating. Public `addItemToOrder` / `removeOrderItem` actions are disabled. QR URLs
encode the bill route directly.

**Consequences:** Admin must operate the ordering UI; guests need network access only for viewing
and paying. `headCount` feeds the payment screen defaults (see ADR-013).

---

## ADR-013: Split modes, digital wallets (demo) and Google reviews

**Status:** accepted

**Context:** Chilean dine-in guests need equal splits aligned to table headcount, or
by-consumption splits where each payer selects their items. Wallet buttons (Apple Pay / Google
Pay) must feel native even in a sandbox deployment. Post-payment, restaurants benefit from Google
Maps reviews.

**Decision:** `Payment.splitMode` is `EQUAL` (existing ÷N math, defaulting to `Order.headCount`) or
`BY_ITEMS` with `PaymentItemAllocation` rows tracking which units were paid. Mock provider accepts
`APPLE_PAY` and `GOOGLE_PAY` methods with distinct refs. Optional `Restaurant.googlePlaceId` powers
a post-payment Google review CTA.

**Consequences:** Item-based splits require tracking paid quantities per line. Real wallet rails
replace the mock provider without UI changes. Production Google review links need a verified
Place ID per restaurant.

---

## ADR-014: Staff roles, table assignment, and shift tracking

**Status:** accepted

**Context:** Restaurants have multiple waiters who need to claim or be assigned tables, work in
shifts, and be measured on sales and tips. Owners and managers need visibility; waiters need a
focused mobile/tablet flow without admin settings.

**Decision:** Extend `AdminUser` with `StaffRole` (`OWNER`, `MANAGER`, `WAITER`). Introduce
`Shift` (clock in/out) and `TableService` (active table claim with `ASSIGNED` or `SELF_CLAIMED`
mode). `Order.servedByStaffId` and `OrderItem.addedByStaffId` attribute service. Waiters must
start a shift and claim a table before loading orders; managers/owners see all tables and can
assign or reassign. Performance aggregates are exposed only to `OWNER` and `MANAGER` at
`/dashboard/desempeno`.

**Consequences:** JWT sessions now carry `role`. Re-login is required after role changes. Table
service rows are released automatically when an order is fully paid. Future InsForge/SaaS billing
can scope AI ops agents per `restaurantId` using the same tenant boundary.

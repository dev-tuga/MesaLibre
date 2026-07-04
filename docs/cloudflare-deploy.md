# Despliegue en Cloudflare Workers (MesaLibre)

MesaLibre usa **Next.js 15 + OpenNext** (`@opennextjs/cloudflare`) sobre **Cloudflare Workers**, no Pages estático.

## Requisitos

| Recurso | Detalle |
|---------|---------|
| **Cloudflare Workers Paid** | El bundle (~9.5 MB) supera el límite de 1 MB del plan gratuito. Paid permite hasta 10 MB. |
| **PostgreSQL accesible** | Neon, Supabase, RDS, etc. |
| **Hyperdrive** (recomendado) | Pool de conexiones desde Workers hacia Postgres |
| **Secrets** | `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_BASE_URL`, `PAYMENT_PROVIDER` |

## Configuración del proyecto

```yaml
# deploy.config.yaml
pages_project_slug: mesalibre
production_branch: main
build_command: pnpm build
deploy_command: pnpm deploy
upload_command: pnpm upload
framework: Next.js 15 + @opennextjs/cloudflare
```

## Despliegue vía Git (recomendado)

1. En **Workers & Pages → Create → Connect to Git** → repo `dev-tuga/MesaLibre`.
2. Rama de producción: `main`.
3. Build settings:

| Campo | Comando |
|-------|---------|
| Build command | `pnpm install && pnpm prisma generate && pnpm build` |
| Deploy command | `pnpm deploy` |
| Non-production deploy | `pnpm upload` |

4. Variables de entorno (Production + Preview):

```
AUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
PAYMENT_PROVIDER=mock
NEXT_PUBLIC_APP_BASE_URL=https://mesalibre.<tu-subdominio>.workers.dev
```

5. Tras el primer deploy, actualiza `NEXT_PUBLIC_APP_BASE_URL` con la URL real y redeploy.

## Hyperdrive (Postgres)

1. **Workers & Pages → Hyperdrive → Create** apuntando a tu Postgres.
2. Copia el ID y añádelo en `wrangler.jsonc`:

```jsonc
"hyperdrive": [
  { "binding": "HYPERDRIVE", "id": "<hyperdrive-id>" }
]
```

3. En runtime, Prisma usa `env.HYPERDRIVE.connectionString` automáticamente (`src/lib/prisma.ts`).

## Migraciones y seed

Ejecutar **fuera** de Workers (local o CI):

```bash
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
DATABASE_URL="postgresql://..." pnpm db:seed
```

## Despliegue local (CLI)

```bash
pnpm install
pnpm prisma generate
pnpm opennextjs-cloudflare build   # o: pnpm build + opennextjs-cloudflare build
pnpm deploy                         # requiere wrangler autenticado
```

Autenticación:

```bash
npx wrangler login
# o exportar CLOUDFLARE_API_TOKEN
```

## Validación post-deploy

```bash
curl -sI "https://mesalibre.<subdominio>.workers.dev/"
curl -sI "https://mesalibre.<subdominio>.workers.dev/login"
```

Esperado: **HTTP 200** en `/` y `/login`.

## Desarrollo local

```bash
cp .dev.vars.example .dev.vars   # editar valores
pnpm dev                          # Next.js (Node)
pnpm preview                      # Workers runtime local
```

## Notas técnicas

- Prisma usa `engineType = "client"` + `@prisma/adapter-pg` para reducir el bundle (sin motor Rust).
- `getPrisma()` crea un cliente por request (requisito de Workers).
- Preview de rama y producción son pipelines distintos en Cloudflare.

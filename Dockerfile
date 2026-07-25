# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base: Node 22 LTS + pnpm pinned via corepack
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base

RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && pnpm --version

WORKDIR /app

# ---------------------------------------------------------------------------
# deps: install all workspace dependencies (layer-cached)
# ---------------------------------------------------------------------------
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/autopea/package.json packages/autopea/
COPY packages/autopea-playwright/package.json packages/autopea-playwright/
COPY packages/tests/package.json packages/tests/
COPY packages/examples/package.json packages/examples/

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# build: compile autopea + autopea-playwright
#        (tests import via package exports → dist/)
# ---------------------------------------------------------------------------
FROM deps AS build

COPY packages/autopea/tsdown.config.ts packages/autopea/tsconfig.json packages/autopea/
COPY packages/autopea/src packages/autopea/src
COPY packages/autopea-playwright/tsdown.config.ts packages/autopea-playwright/tsconfig.json packages/autopea-playwright/
COPY packages/autopea-playwright/src packages/autopea-playwright/src

RUN pnpm run build

# ---------------------------------------------------------------------------
# test: Chromium + vitest runner
# ---------------------------------------------------------------------------
FROM base AS test

# Workspace manifests (needed for package resolution)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json /app/
COPY packages/autopea/package.json /app/packages/autopea/
COPY packages/autopea-playwright/package.json /app/packages/autopea-playwright/
COPY packages/tests/package.json /app/packages/tests/
COPY packages/examples/package.json /app/packages/examples/

# Dependencies — pnpm symlink layout is preserved through COPY
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/autopea/node_modules /app/packages/autopea/node_modules
COPY --from=deps /app/packages/autopea-playwright/node_modules /app/packages/autopea-playwright/node_modules
COPY --from=deps /app/packages/tests/node_modules /app/packages/tests/node_modules

# Chromium via Playwright (--with-deps installs matching system libraries)
RUN node packages/tests/node_modules/playwright/cli.js install --with-deps chromium

# Built packages
COPY --from=build /app/packages/autopea/dist /app/packages/autopea/dist
COPY --from=build /app/packages/autopea-playwright/dist /app/packages/autopea-playwright/dist

# Test source + fixtures
COPY packages/tests /app/packages/tests

WORKDIR /app/packages/tests

CMD ["pnpm", "test"]

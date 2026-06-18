FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

# Manifests + shared TS config first, so the install layer caches well.
# tsconfig.base.json is required: every package's tsconfig extends it, and
# without it tsc silently falls back to an ES3 target and the build fails.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/mcp-server/package.json ./packages/mcp-server/
COPY packages/renderer-node/package.json ./packages/renderer-node/

# Browsers aren't needed to build or to inspect tools; render pulls chromium
# lazily at runtime. Skip the heavy postinstall download.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN pnpm install --frozen-lockfile \
  --filter @excalidraw-skill-pack/mcp-server... \
  --filter @excalidraw-skill-pack/core \
  --filter @excalidraw-skill-pack/render

COPY packages/core ./packages/core
COPY packages/mcp-server ./packages/mcp-server
COPY packages/renderer-node ./packages/renderer-node
# render_template.html in renderer-node/src is a symlink into shared/.
COPY packages/shared ./packages/shared

# Build only the server and its workspace dependencies (core, render).
RUN pnpm --filter @excalidraw-skill-pack/mcp-server... build

CMD ["node", "packages/mcp-server/dist/server.js"]

FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/mcp-server/package.json ./packages/mcp-server/
COPY packages/renderer-node/package.json ./packages/renderer-node/
COPY packages/install/package.json ./packages/install/
COPY packages/create-excalidraw-theme/package.json ./packages/create-excalidraw-theme/

RUN pnpm install --frozen-lockfile

COPY packages/core ./packages/core
COPY packages/mcp-server ./packages/mcp-server
COPY packages/renderer-node ./packages/renderer-node
COPY packages/install ./packages/install
COPY packages/create-excalidraw-theme ./packages/create-excalidraw-theme
COPY packages/shared ./packages/shared
COPY packages/themes ./packages/themes
COPY packages/renderer-python ./packages/renderer-python

RUN pnpm -r build

CMD ["node", "packages/mcp-server/dist/server.js"]

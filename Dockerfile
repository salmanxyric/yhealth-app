# Build both client (Next.js) and server (Node/TypeScript) for yhealth-app
# Build: docker build -t yhealth-app .
# Optional targets: docker build --target client -t yhealth-client . | docker build --target server -t yhealth-server .

# -----------------------------------------------------------------------------
# Stage 1: Build client (Next.js)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy client package files
COPY client/package.json client/package-lock.json* ./client/

# Install client dependencies (use npm ci when lockfile exists)
WORKDIR /app/client
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# Copy client source
WORKDIR /app
COPY client ./client
WORKDIR /app/client

# Next.js build (needs NODE_ENV=production for optimized output)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Build server (TypeScript)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy shared types (server references ../../shared)
COPY shared ./shared

# Copy server package files
COPY server/package.json server/package-lock.json* ./server/

WORKDIR /app/server
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

# Copy server source
WORKDIR /app
COPY server ./server
WORKDIR /app/server

# TypeScript build
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Final image with both artifacts (for verification / run both)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS final

WORKDIR /app

# Copy server runtime
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy client runtime (.next + static)
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/public ./client/public
COPY --from=client-builder /app/client/package.json ./client/package.json
COPY --from=client-builder /app/client/node_modules ./client/node_modules

# Default: run server only (client can be served via next start in another container or reverse proxy)
ENV NODE_ENV=production
WORKDIR /app/server
EXPOSE 9090
CMD ["node", "dist/index.js"]

# Build yHealth server (Node/TypeScript) for Railway deployment
# Build: docker build -t yhealth-server .
# Run:   docker run -p 5000:5000 yhealth-server

# -----------------------------------------------------------------------------
# Stage 1: Build server (TypeScript)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS server-builder

WORKDIR /app

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
# Stage 2: Production runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS final

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy server production dependencies
COPY --from=server-builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules

# Copy built application
COPY --from=server-builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=server-builder --chown=nodejs:nodejs /app/server/package.json ./server/

# Copy database table SQL files (needed by auto-migrate at runtime)
COPY --from=server-builder --chown=nodejs:nodejs /app/server/src/database/tables ./server/dist/src/database/tables
COPY --from=server-builder --chown=nodejs:nodejs /app/server/src/database/migrations ./server/dist/src/database/migrations

# Copy email templates (EJS files needed at runtime)
COPY --from=server-builder --chown=nodejs:nodejs /app/server/src/mails ./server/src/mails
# Symlink email templates to where compiled JS expects them
RUN mkdir -p server/dist/src && \
    ln -sf /app/server/src/mails server/dist/src/mails

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

WORKDIR /app/server
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/index.js"]

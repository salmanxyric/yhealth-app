# Multi-stage Dockerfile for yHealth Node.js/Express server
# Build context: PRODUCTS/yhealth-app/server/
# Build: docker build -t yhealth-server .
# Run: docker run -p 5000:5000 yhealth-server

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --legacy-peer-deps --only=production 2>/dev/null || \
    npm install --legacy-peer-deps --only=production

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci --legacy-peer-deps 2>/dev/null || \
    npm install --legacy-peer-deps

# Copy server source code, including server-local shared types
COPY src ./src
COPY shared ./shared
COPY tsconfig.json ./tsconfig.json

# Set build-time environment
ENV NODE_ENV=production

# Build TypeScript to JavaScript
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy email templates (EJS files needed at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/src/mails ./src/mails

# Copy database table SQL files (needed by auto-migrate at runtime)
COPY --from=builder --chown=nodejs:nodejs /app/src/database/tables ./dist/src/database/tables
COPY --from=builder --chown=nodejs:nodejs /app/src/database/migrations ./dist/src/database/migrations

# Symlink email templates to where compiled JS expects them (__dirname + '../mails')
RUN mkdir -p dist/src && \
    ln -s /app/src/mails dist/src/mails

# Switch to non-root user
USER nodejs

EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/src/index.js"]


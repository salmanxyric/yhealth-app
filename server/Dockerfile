# Multi-stage Dockerfile for yHealth Node.js/Express server
# Build from root: docker build -t yhealth-server -f server/Dockerfile .
# Build from server: docker build -t yhealth-server -f Dockerfile .
# Run: docker run -p 5000:5000 yhealth-server

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files (works from both root and server context)
COPY server/package.json server/package-lock.json* ./server/

# Install production dependencies only
WORKDIR /app/server
RUN npm ci --legacy-peer-deps --only=production 2>/dev/null || \
    npm install --legacy-peer-deps --only=production

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared types (needed for TypeScript compilation)
COPY shared ./shared

# Copy package files
COPY server/package.json server/package-lock.json* ./server/

WORKDIR /app/server

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci --legacy-peer-deps 2>/dev/null || \
    npm install --legacy-peer-deps

# Copy server source code
COPY server/src ./src
COPY server/tsconfig.json ./tsconfig.json

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
COPY --from=deps --chown=nodejs:nodejs /app/server/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server/package.json ./package.json

# Copy email templates (EJS files needed at runtime)
# Templates must be at dist/server/src/mails/ because compiled JS uses __dirname relative paths
COPY --from=builder --chown=nodejs:nodejs /app/server/src/mails ./dist/server/src/mails

# Switch to non-root user
USER nodejs

EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/server/src/index.js"]


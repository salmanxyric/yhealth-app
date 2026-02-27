# Docker Setup Guide

This guide explains the optimized Docker setup for the yhealth-app MERN stack project.

## Problem Solved

The original Docker build was stuck at "transferring context: 1.88GB" because:
- `node_modules` folders (root, client, server) were being copied (~1.5GB+)
- `.git` folder was included (~100-200MB)
- Build artifacts (`.next`, `dist`) were being copied
- Test files, documentation, and other unnecessary files were included

## Solution

Created optimized multi-stage Dockerfiles with comprehensive `.dockerignore` files that exclude:
- All `node_modules` folders
- `.git` directory
- Build artifacts (`.next`, `dist`, `build`)
- Test files and coverage reports
- Documentation files
- IDE and OS-specific files
- Log files and cache directories

## Files Created

### 1. `.dockerignore` Files
- **Root `.dockerignore`**: Excludes common files from root context
- **`client/.dockerignore`**: Client-specific exclusions
- **`server/.dockerignore`**: Server-specific exclusions

### 2. Dockerfiles
- **`client/Dockerfile`**: Multi-stage build for Next.js client
  - Stage 1: Install production dependencies
  - Stage 2: Build Next.js with standalone output
  - Stage 3: Minimal runtime image with only necessary files
  
- **`server/Dockerfile`**: Multi-stage build for Node.js/Express server
  - Stage 1: Install production dependencies
  - Stage 2: Build TypeScript to JavaScript
  - Stage 3: Minimal runtime image with compiled code and email templates

### 3. `docker-compose.yml`
Orchestrates both services with:
- Network configuration
- Health checks
- Environment variables
- Port mappings

## Build Context Reduction

**Before**: ~1.88GB context
**After**: ~50-100MB context (source code only)

The build context is now reduced by **95%+**, resulting in:
- Faster builds
- Less network transfer
- Smaller Docker images
- Faster CI/CD pipelines

## Building and Running

### Build Individual Services

```bash
# Build client
docker build -t yhealth-client -f client/Dockerfile .

# Build server
docker build -t yhealth-server -f server/Dockerfile .
```

### Build and Run with Docker Compose

```bash
# Build and start both services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Create a `.env` file in the root directory with required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/yhealth

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Other required variables (see server/src/config/env.config.ts)
```

## Image Sizes

Expected image sizes after optimization:
- **Client**: ~200-300MB (down from ~1GB+)
- **Server**: ~250-350MB (down from ~800MB+)

## Key Optimizations

1. **Multi-stage builds**: Separate build and runtime stages
2. **Alpine Linux**: Lightweight base images (node:20-alpine)
3. **Standalone output**: Next.js standalone mode for minimal client image
4. **Production-only deps**: Separate production dependencies
5. **Non-root users**: Security best practice
6. **Layer caching**: Optimized COPY order for better caching
7. **Health checks**: Built-in container health monitoring

## Troubleshooting

### Build fails with "shared not found"
- Ensure you're building from the root directory
- The Dockerfiles expect the `shared` folder at the root level

### Port conflicts
- Change ports in `docker-compose.yml` if 3000 or 5000 are in use
- Update `CORS_ORIGIN` environment variable accordingly

### Database connection issues
- Update `DATABASE_URL` in `docker-compose.yml` or `.env` file
- Ensure database is accessible from Docker network
- For local database, use `host.docker.internal` as hostname

### Next.js build errors
- Ensure `next.config.ts` has `output: 'standalone'` configured
- Check that all required environment variables are set

## Next Steps

1. Set up environment variables in `.env` file
2. Configure database connection
3. Update `CORS_ORIGIN` to match your deployment URL
4. Test the build: `docker-compose up --build`
5. Verify health checks: `docker-compose ps`

## Notes

- The root `Dockerfile` is kept for backward compatibility but separate Dockerfiles are recommended
- Both client and server reference the `shared` folder, so builds must be from root context
- Email templates (`server/src/mails/*.ejs`) are included in the server image as they're needed at runtime
- Next.js standalone output creates a minimal server - nginx can be added as a reverse proxy if needed



# Setup Guide

This guide provides detailed instructions for setting up the yHealth development environment.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **PostgreSQL** 14.0 or higher
- **Git** 2.30.0 or higher

### Optional but Recommended

- **Docker** and **Docker Compose** (for containerized development)
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** (for API testing)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/yhealth-app.git
cd yhealth-app
```

### 2. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install shared dependencies (if any)
cd ../shared
npm install
```

### 3. Set Up Environment Variables

#### Client Environment Variables

Create `client/.env.local`:

```bash
cd client
cp .env.example .env.local
# Edit .env.local with your values
```

**Required variables:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:5000/api`)
- `NEXTAUTH_URL` - Frontend URL (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Generate a random secret (min 32 characters)

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### Server Environment Variables

Create `server/.env`:

```bash
cd server
cp .env.example .env
# Edit .env with your values
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Generate a random secret (min 32 characters)
- `NEXTAUTH_SECRET` - Should match client's NEXTAUTH_SECRET
- `PORT` - Server port (default: `5000`)

**Generate secrets:**
```bash
# JWT_SECRET
openssl rand -base64 32

# SESSION_SECRET
openssl rand -base64 32
```

### 4. Set Up Database

#### Using PostgreSQL Directly

1. **Create database:**
   ```bash
   createdb yhealth
   ```

2. **Run migrations:**
   ```bash
   cd server
   npm run db:migrate
   ```

3. **Seed database (optional):**
   ```bash
   npm run db:seed
   ```

#### Using Docker

```bash
# Start PostgreSQL container
docker run --name yhealth-postgres \
  -e POSTGRES_USER=yhealth \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=yhealth \
  -p 5432:5432 \
  -d postgres:14

# Update DATABASE_URL in server/.env
DATABASE_URL=postgresql://yhealth:password@localhost:5432/yhealth
```

### 5. Start Development Servers

#### Terminal 1: Server
```bash
cd server
npm run dev
```

Server will run on: http://localhost:5000

#### Terminal 2: Client
```bash
cd client
npm run dev
```

Client will run on: http://localhost:3000

## Verification

### Check Server Health

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T..."
}
```

### Check Client

Open http://localhost:3000 in your browser. You should see the yHealth landing page.

## Common Issues

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port
PORT=3001 npm run dev
```

### Database Connection Failed

**Error:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   pg_isready  # macOS/Linux
   # or check via Docker
   docker ps | grep postgres
   ```

2. Check DATABASE_URL in `server/.env`

3. Verify database exists:
   ```bash
   psql -l | grep yhealth
   ```

### Module Not Found Errors

**Error:** `Cannot find module '...'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Error:** Type errors in IDE

**Solutions:**
1. Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
2. Rebuild:
   ```bash
   npm run build
   ```

## Development Tools

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Next Steps

- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- Check [docs/](./) for additional documentation
- Review [README.md](../README.md) for project overview

## Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/your-org/yhealth-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/yhealth-app/discussions)


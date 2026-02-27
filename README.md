# yHealth - AI-Powered Fitness & Wellness Platform

<div align="center">

![yHealth Logo](https://via.placeholder.com/200x60/10b981/ffffff?text=yHealth)

**A comprehensive SaaS platform for fitness tracking, nutrition planning, wellbeing management, and AI-powered coaching.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## 🎯 Overview

yHealth is a modern, full-stack SaaS application designed to help users achieve their fitness and wellness goals through:

- **Fitness Tracking**: Workout planning, progress monitoring, and performance analytics
- **Nutrition Management**: Meal planning, macro tracking, and dietary recommendations
- **Wellbeing Dashboard**: Mood tracking, energy monitoring, stress management, and habit building
- **AI Coaching**: Personalized workout and nutrition recommendations powered by AI
- **Community Features**: Social sharing, challenges, and leaderboards

## 🏗️ Architecture

This is a monorepo containing:

- **`client/`** - Next.js 16 frontend application (App Router, React 19, TypeScript)
- **`server/`** - Express.js backend API (Node.js, TypeScript, PostgreSQL)
- **`shared/`** - Shared TypeScript types and utilities

### System Architecture

```
┌─────────────────┐
│   Next.js App   │  (Client - Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │ WebSocket
┌────────▼────────┐
│  Express API    │  (Server - Port 5000)
│   (Backend)     │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  (Database)
│   + Redis       │  (Cache/Sessions)
└─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI + shadcn/ui

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Custom SQL queries with connection pooling
- **Authentication**: JWT + NextAuth.js
- **Validation**: Zod
- **Testing**: Jest

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Deployment**: Railway / Vercel
- **Monitoring**: (To be configured)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (or Docker)
- **Git** 2.30+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/yhealth-app.git
   cd yhealth-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (if any)
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Client
   cd client
   cp .env.example .env.local
   # Edit .env.local with your values

   # Server
   cd ../server
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Set up the database**
   ```bash
   cd server
   npm run db:setup
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Start server
   cd server
   npm run dev

   # Terminal 2: Start client
   cd client
   npm run dev
   ```

6. **Open the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔄 Development Workflow

### Branching Strategy

We follow **Git Flow** with the following branches:

- **`main`** - Production branch (protected)
- **`develop`** - Staging/development branch
- **`feature/*`** - New features (e.g., `feature/wellbeing-dashboard`)
- **`fix/*`** - Bug fixes (e.g., `fix/auth-token-expiry`)
- **`hotfix/*`** - Critical production fixes (e.g., `hotfix/security-patch`)

### Workflow Steps

1. **Create a feature branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add wellbeing dashboard analytics"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub: feature/your-feature-name → develop
   ```

4. **After review and merge to develop**
   - Code is tested on staging
   - Merge to `main` via release process

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(wellbeing): add KPI dashboard with analytics charts
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
refactor(api): optimize database query performance
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📁 Project Structure

```
yhealth-app/
├── client/                 # Next.js frontend application
│   ├── app/                # App Router pages and layouts
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── public/             # Static assets
│
├── server/                 # Express.js backend API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── database/      # Database migrations and queries
│   │   ├── middlewares/   # Express middlewares
│   │   └── utils/         # Utility functions
│   └── tests/             # Test files
│
├── shared/                 # Shared TypeScript types
│   └── types/              # Domain types and interfaces
│
├── .github/                # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
│
├── docs/                   # Project documentation
├── CONTRIBUTING.md         # Contribution guidelines
├── CODE_OF_CONDUCT.md      # Code of conduct
└── README.md               # This file
```

## 🚢 Deployment

### Staging (develop branch)

Automatically deployed to staging environment on merge to `develop`.

### Production (main branch)

1. **Create a release branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/v1.2.0
   ```

2. **Update version numbers**
   - Update `package.json` versions
   - Update CHANGELOG.md

3. **Merge to main**
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

4. **Deploy**
   - Production deployment is triggered automatically via GitHub Actions
   - Or manually deploy via Railway/Vercel dashboard

### Environment-Specific Configuration

- **Development**: Local development with hot reload
- **Staging**: `develop` branch → Staging environment
- **Production**: `main` branch → Production environment

## 📦 Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes (backward compatible)

Version format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code of conduct
- Development setup
- Pull request process
- Coding standards
- Commit message guidelines

## 🔒 Security

### Reporting Security Issues

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, email: **security@yhealth.app**

We take security seriously and will respond promptly.

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Keep dependencies updated
- Follow secure coding practices
- See [SECURITY.md](./SECURITY.md) for details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/yhealth-app/issues)
- **Email**: support@yhealth.app

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

<div align="center">

**Made with ❤️ by the yHealth Team**

[Website](https://yhealth.app) • [Documentation](./docs/) • [Changelog](./CHANGELOG.md)

</div>


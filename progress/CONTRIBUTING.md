# Contributing to yHealth

Thank you for your interest in contributing to yHealth! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/yhealth-app.git
   cd yhealth-app
   ```

3. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/your-org/yhealth-app.git
   ```

4. **Create a branch**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

## 🔄 Development Workflow

### Branch Naming Convention

- **Features**: `feature/description` (e.g., `feature/wellbeing-dashboard`)
- **Bug Fixes**: `fix/description` (e.g., `fix/auth-token-expiry`)
- **Hotfixes**: `hotfix/description` (e.g., `hotfix/security-patch`)
- **Documentation**: `docs/description` (e.g., `docs/api-documentation`)

### Workflow Steps

1. **Create your feature branch from `develop`**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Follow the coding standards
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Client
   cd client
   npm run lint
   npm run test
   npm run build

   # Server
   cd server
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

4. **Commit your changes** (see [Commit Message Guidelines](#commit-message-guidelines))

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Target: `develop` (for features/fixes) or `main` (for hotfixes)
   - Fill out the PR template
   - Link any related issues
   - Request review from maintainers

## 📝 Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **`feat`**: A new feature
- **`fix`**: A bug fix
- **`docs`**: Documentation only changes
- **`style`**: Code style changes (formatting, missing semi-colons, etc.)
- **`refactor`**: Code refactoring without feature changes or bug fixes
- **`perf`**: Performance improvements
- **`test`**: Adding or updating tests
- **`chore`**: Maintenance tasks (dependencies, build config, etc.)
- **`ci`**: CI/CD changes
- **`build`**: Build system changes

### Scope (Optional)

The scope should be the name of the package/area affected:
- `wellbeing` - Wellbeing features
- `auth` - Authentication
- `api` - API changes
- `ui` - UI components
- `server` - Server-side changes
- `client` - Client-side changes

### Examples

**Good commit messages:**
```bash
feat(wellbeing): add KPI dashboard with analytics charts

fix(auth): resolve token refresh race condition

docs(readme): update installation instructions

refactor(api): optimize database query performance

test(wellbeing): add unit tests for StatCard component

chore(deps): update dependencies to latest versions
```

**Bad commit messages:**
```bash
# Too vague
"update code"
"fix bug"
"changes"

# Missing type
"add dashboard"
"fix auth"

# Not descriptive
"feat: stuff"
"fix: it"
```

### Commit Body (Optional)

For complex changes, add a body explaining:
- **What**: What changed and why
- **Why**: Motivation for the change
- **How**: Implementation details (if relevant)

Example:
```
feat(wellbeing): add KPI dashboard with analytics charts

Implement a comprehensive wellbeing dashboard featuring:
- 4 KPI stat cards (Overall, Mood, Energy, Stress)
- AI insights panel with actionable recommendations
- Analytics charts (trend line and habit completion)
- 8 module cards with hover animations

Uses Framer Motion for smooth animations and Recharts
for data visualization. All components are fully typed
with TypeScript and follow accessibility best practices.
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] No new warnings or errors
- [ ] Branch is up to date with `develop`

### PR Template

When creating a PR, include:

1. **Description**: What changes does this PR introduce?
2. **Type**: Feature, Bug Fix, Refactor, Documentation, etc.
3. **Related Issues**: Link to related issues (e.g., `Closes #123`)
4. **Testing**: How was this tested?
5. **Screenshots**: If UI changes, include before/after screenshots
6. **Checklist**: Confirm all items are completed

### Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one maintainer approval required
3. **Testing**: Manual testing may be requested
4. **Merge**: Once approved, maintainers will merge

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Enable strict mode in `tsconfig.json`

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use semicolons
- **Line Length**: Max 100 characters
- **Naming**: 
  - Components: PascalCase (`WellbeingDashboard`)
  - Functions/Variables: camelCase (`getUserData`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
  - Files: kebab-case (`wellbeing-dashboard.tsx`)

### React/Next.js

- Use functional components with hooks
- Use TypeScript for props: `interface ComponentProps { ... }`
- Extract reusable logic into custom hooks
- Use `useMemo` and `useCallback` appropriately
- Follow Next.js App Router conventions

### Backend

- Use async/await (avoid callbacks)
- Handle errors properly with try/catch
- Validate input with Zod schemas
- Use proper HTTP status codes
- Log errors appropriately

### File Organization

```
components/
  feature-name/
    ComponentName.tsx
    ComponentName.test.tsx
    index.ts
```

## 🧪 Testing Guidelines

### Client Tests

- Unit tests for utilities and hooks
- Component tests with React Testing Library
- Integration tests for critical user flows
- Aim for >80% code coverage

### Server Tests

- Unit tests for services and utilities
- Integration tests for API endpoints
- Database tests with test database
- Mock external dependencies

### Running Tests

```bash
# Client
cd client
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Server
cd server
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📚 Documentation

- Update README.md for significant changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md for user-facing changes
- Include code examples in documentation

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/your-org/yhealth-app/discussions)
- Check existing [Issues](https://github.com/your-org/yhealth-app/issues)
- Contact maintainers: dev@yhealth.app

Thank you for contributing to yHealth! 🎉


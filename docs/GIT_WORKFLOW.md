# Git & GitHub Workflow Guide

This document provides a comprehensive guide to the Git and GitHub workflow for yHealth.

## 📋 Overview

We follow a **Git Flow** branching strategy with the following principles:

- **main** - Production-ready code (protected)
- **develop** - Integration branch for features (protected)
- **feature/** - New features
- **fix/** - Bug fixes
- **hotfix/** - Critical production fixes

## 🌿 Branching Strategy

### Main Branches

#### `main` (Production)
- **Purpose**: Production-ready, stable code
- **Protection**: Heavily protected (2 approvals required)
- **Deployment**: Automatically deployed to production
- **Merges From**: `develop` (via releases) or `hotfix/*`

#### `develop` (Staging)
- **Purpose**: Integration branch for all features
- **Protection**: Protected (1 approval required)
- **Deployment**: Automatically deployed to staging
- **Merges From**: `feature/*`, `fix/*`

### Supporting Branches

#### `feature/*` (Features)
- **Purpose**: Develop new features
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Naming**: `feature/wellbeing-dashboard`, `feature/user-profile`

**Example:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/wellbeing-dashboard
# ... make changes ...
git push origin feature/wellbeing-dashboard
# Create PR: feature/wellbeing-dashboard → develop
```

#### `fix/*` (Bug Fixes)
- **Purpose**: Fix bugs in development
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Naming**: `fix/auth-token-expiry`, `fix/dashboard-loading`

**Example:**
```bash
git checkout develop
git pull origin develop
git checkout -b fix/auth-token-expiry
# ... fix bug ...
git push origin fix/auth-token-expiry
# Create PR: fix/auth-token-expiry → develop
```

#### `hotfix/*` (Critical Fixes)
- **Purpose**: Fix critical production issues
- **Branch From**: `main`
- **Merge To**: `main` and `develop`
- **Naming**: `hotfix/security-patch`, `hotfix/critical-bug`

**Example:**
```bash
git checkout main
git pull origin main
git checkout -b hotfix/security-patch
# ... fix critical issue ...
git push origin hotfix/security-patch
# Create PR: hotfix/security-patch → main
# After merge, also merge main → develop
```

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance
- `ci`: CI/CD changes
- `build`: Build system

### Examples

```bash
feat(wellbeing): add KPI dashboard with analytics
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
refactor(api): optimize database queries
test(wellbeing): add unit tests for StatCard
chore(deps): update dependencies
```

## 🔄 Workflow Steps

### 1. Starting a New Feature

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Creating a Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select: `feature/your-feature-name` → `develop`
4. Fill out PR template
5. Request reviews
6. Wait for CI/CD to pass
7. Address review comments
8. Merge after approval

### 3. Merging a Pull Request

**Options:**
- **Squash and merge** (recommended for feature branches)
- **Rebase and merge** (for clean history)
- **Merge commit** (not recommended - disabled for main/develop)

### 4. Releasing to Production

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version numbers
# Update CHANGELOG.md
git add .
git commit -m "chore: bump version to 1.2.0"

# Merge to main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.2.0
git push origin develop
```

## 🛡️ Branch Protection

### Main Branch

- ✅ Require 2 pull request reviews
- ✅ Require status checks to pass
- ✅ Require linear history
- ✅ Require signed commits (optional)
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

### Develop Branch

- ✅ Require 1 pull request review
- ✅ Require status checks to pass
- ✅ Require linear history
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

See [.github/BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md) for detailed configuration.

## 🔍 Code Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one approval required
3. **Status Checks**: All must pass before merge
4. **Conversation Resolution**: All comments must be addressed

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Security considerations addressed

## 🚨 Emergency Procedures

### Hotfix Process

For critical production issues:

1. Create `hotfix/description` from `main`
2. Make minimal fix
3. Create PR: `hotfix/*` → `main`
4. Fast-track review (1 approval)
5. Merge to `main`
6. Merge `main` → `develop`
7. Tag release

### Bypassing Protection (Admin Only)

In extreme emergencies:

1. Temporarily disable branch protection
2. Make critical fix
3. Re-enable protection immediately
4. Document bypass in post-mortem

## 📊 Best Practices

### Do's ✅

- Always branch from `develop` for features
- Use descriptive branch names
- Write clear commit messages
- Keep PRs small and focused
- Test before pushing
- Update documentation
- Request reviews early

### Don'ts ❌

- Don't commit directly to `main` or `develop`
- Don't force push to protected branches
- Don't merge your own PRs (unless approved)
- Don't skip CI/CD checks
- Don't commit secrets
- Don't mix unrelated changes in one PR

## 🔧 Useful Commits

### Interactive Rebase

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Squash commits
# Change "pick" to "squash" for commits to combine
```

### Amend Last Commit

```bash
# Add changes to last commit
git add .
git commit --amend --no-edit

# Change commit message
git commit --amend -m "new message"
```

### Stash Changes

```bash
# Save uncommitted changes
git stash

# Apply stashed changes
git stash pop

# List stashes
git stash list
```

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [.github/BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md)

---

**Last Updated**: 2026-02-14


# Branch Protection Strategy

This document explains how to configure branch protection rules for the yHealth repository to ensure code quality and maintain a secure, stable codebase.

## 🛡️ Protected Branches

### Main Branch (Production)

The `main` branch represents production-ready code and should be heavily protected.

**Required Settings:**

1. **Require pull request reviews before merging**
   - Required approvals: **2**
   - Dismiss stale pull request approvals when new commits are pushed: **Enabled**
   - Require review from Code Owners: **Enabled** (if CODEOWNERS file exists)

2. **Require status checks to pass before merging**
   - Required status checks:
     - `client - Lint, Type Check, Test & Build`
     - `server - Lint, Type Check, Test & Build`
     - `security - Dependency & Secret Scanning`
     - `All Checks Passed`
   - Require branches to be up to date before merging: **Enabled**

3. **Require conversation resolution before merging**
   - **Enabled** - All PR comments must be resolved

4. **Require linear history**
   - **Enabled** - Prevents merge commits, enforces rebase/squash

5. **Require signed commits** (Optional but recommended)
   - **Enabled** - All commits must be signed

6. **Do not allow bypassing the above settings**
   - **Enabled** - Even admins must follow these rules

7. **Restrict who can push to matching branches**
   - **Enabled** - Only specific teams/individuals can push directly

8. **Allow force pushes**
   - **Disabled** - Never allow force pushes to main

9. **Allow deletions**
   - **Disabled** - Never allow branch deletion

### Develop Branch (Staging)

The `develop` branch is the integration branch for features.

**Required Settings:**

1. **Require pull request reviews before merging**
   - Required approvals: **1**
   - Dismiss stale approvals: **Enabled**

2. **Require status checks to pass before merging**
   - Same status checks as main
   - Require up to date: **Enabled**

3. **Require linear history**
   - **Enabled**

4. **Allow force pushes**
   - **Disabled**

5. **Allow deletions**
   - **Disabled**

## 🔧 How to Configure

### Via GitHub Web Interface

1. Go to repository **Settings** → **Branches**
2. Click **Add rule** or edit existing rule
3. Configure branch name pattern (e.g., `main`, `develop`)
4. Enable the required settings as described above
5. Click **Create** or **Save changes**

### Via GitHub API

```bash
# Example: Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["client","server","security"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

### Via Terraform (Infrastructure as Code)

```hcl
resource "github_branch_protection" "main" {
  repository_id = github_repository.balencia.id
  pattern       = "main"

  required_status_checks {
    strict   = true
    contexts = ["client", "server", "security"]
  }

  required_pull_request_reviews {
    required_approving_review_count = 2
    dismiss_stale_reviews          = true
    require_code_owner_reviews     = true
  }

  enforce_admins                  = true
  require_linear_history          = true
  require_signed_commits          = true
  allow_force_pushes              = false
  allow_deletions                 = false
  required_conversation_resolution = true
}
```

## 📋 Branch Rules Summary

| Branch | Approvals | Status Checks | Linear History | Force Push | Deletion |
|--------|-----------|---------------|----------------|------------|----------|
| `main` | 2 | Required | ✅ | ❌ | ❌ |
| `develop` | 1 | Required | ✅ | ❌ | ❌ |
| `feature/*` | 0 | Optional | ❌ | ✅ | ✅ |
| `fix/*` | 0 | Optional | ❌ | ✅ | ✅ |
| `hotfix/*` | 1 | Required | ✅ | ❌ | ❌ |

## 🔐 CODEOWNERS File

Create `.github/CODEOWNERS` to automatically request reviews from code owners:

```
# Global owners
* @balencia-team/maintainers

# Client code
/client/ @balencia-team/frontend-team
/client/app/ @balencia-team/frontend-team

# Server code
/server/ @balencia-team/backend-team
/server/src/ @balencia-team/backend-team

# Database
/server/src/database/ @balencia-team/backend-team @balencia-team/database-team

# Documentation
/docs/ @balencia-team/docs-team
*.md @balencia-team/docs-team

# CI/CD
/.github/ @balencia-team/devops-team
```

## 🚨 Emergency Procedures

### Hotfix Process

For critical production issues:

1. Create `hotfix/description` branch from `main`
2. Make minimal fix
3. Create PR: `hotfix/*` → `main`
4. Requires 1 approval (can be fast-tracked)
5. Merge to `main`
6. Merge `main` back to `develop`
7. Tag release

### Bypassing Protection (Admin Only)

In extreme emergencies, admins can temporarily disable protection:

1. Go to Settings → Branches
2. Temporarily disable protection
3. Make critical fix
4. Re-enable protection immediately
5. Document the bypass in a post-mortem

**Note**: This should be extremely rare and always documented.

## 📊 Monitoring

- **Branch Protection Status**: Check via GitHub API or dashboard
- **Failed Checks**: Monitor via GitHub Actions
- **Review Coverage**: Track via GitHub Insights

## 🔄 Best Practices

1. **Never disable protection permanently**
2. **Document all bypasses**
3. **Review protection rules quarterly**
4. **Keep CODEOWNERS updated**
5. **Monitor failed checks regularly**
6. **Train team on branch protection rules**

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**Last Updated**: 2026-02-14


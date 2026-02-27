Act as a senior DevOps engineer and principal software architect.

Set up a production-grade Git + GitHub workflow for a SaaS fitness application built with Next.js + TypeScript.

Requirements:

1. Git Structure
- Implement a professional branching strategy:
  - main (production)
  - develop (staging)
  - feature/*
  - fix/*
  - hotfix/*
- Add README documentation explaining the workflow clearly.

2. Commit Standards
- Implement Conventional Commits format.
- Add commit message guidelines in CONTRIBUTING.md.
- Add examples (feat, fix, refactor, chore, docs).

3. Repository Setup
- Create:
  - .gitignore (Node/Next.js optimized)
  - .env.example (no secrets)
  - README.md (professional SaaS style)
  - CONTRIBUTING.md
  - CODE_OF_CONDUCT.md

4. GitHub Actions (CI/CD)
Create a production-ready GitHub Actions workflow that:
- Runs on pull_request and push
- Installs dependencies
- Runs lint
- Runs type check
- Runs tests
- Builds the project
- Fails on error
- Uses caching for node_modules
- Supports Node 18+

5. Branch Protection Strategy
Explain how to configure:
- Required PR review
- Required status checks
- Prevent direct push to main
- Require linear history

6. Security
- Add instructions for:
  - Secret scanning
  - Environment variable management
  - Protected branches
  - Dependabot setup

7. Professional Documentation
- Add clean comments in YAML
- Write README with:
  - Setup steps
  - Development workflow
  - Deployment process
  - Versioning strategy (SemVer)

Output:
- Full folder/file structure
- Full GitHub Actions YAML
- All documentation files
- Clear explanation comments
- Production-level clarity

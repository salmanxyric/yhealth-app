# Security Policy

## 🔒 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Email (Preferred)
- **Email**: security@yhealth.app
- **Subject**: `[SECURITY] Brief description of the vulnerability`
- **Response Time**: We aim to respond within 48 hours

### Security Advisory
- Create a [GitHub Security Advisory](https://github.com/your-org/yhealth-app/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact if exploited
3. **Steps to Reproduce**: Detailed steps to reproduce
4. **Proof of Concept**: If possible, include a PoC (keep it minimal and safe)
5. **Suggested Fix**: If you have ideas for a fix
6. **Affected Versions**: Which versions are affected

## 🔐 Security Best Practices

### For Contributors

1. **Never commit secrets**
   - API keys, passwords, tokens
   - Database credentials
   - Private keys
   - Use `.env` files (gitignored)

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Validate all input**
   - Use Zod schemas for validation
   - Sanitize user input
   - Use parameterized queries

4. **Follow secure coding practices**
   - Use HTTPS in production
   - Implement proper authentication
   - Use rate limiting
   - Validate file uploads

5. **Review code before committing**
   - Check for hardcoded secrets
   - Verify input validation
   - Ensure error handling doesn't leak information

### Environment Variables

**Never commit these to version control:**

- `.env`
- `.env.local`
- `.env.production`
- Any file containing secrets

**Use `.env.example` files** to document required variables without exposing values.

### Secret Management

- **Development**: Use `.env.local` (gitignored)
- **Staging/Production**: Use secure secret management:
  - GitHub Secrets (for CI/CD)
  - Railway/Vercel environment variables
  - AWS Secrets Manager (if applicable)

## 🛡️ Security Features

### Implemented

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ HTTPS enforcement in production
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation with Zod
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React's built-in escaping)
- ✅ CSRF protection (NextAuth.js)

### Planned

- [ ] Secret scanning in CI/CD
- [ ] Dependency vulnerability scanning
- [ ] Security headers (Helmet.js)
- [ ] Content Security Policy (CSP)
- [ ] Regular security audits

## 🔍 Security Scanning

### Automated Scanning

Our CI/CD pipeline includes:

- **Dependency Scanning**: npm audit
- **Vulnerability Scanning**: Trivy
- **Secret Scanning**: GitHub Advanced Security (if enabled)

### Manual Scanning

```bash
# Check for known vulnerabilities
cd client && npm audit
cd server && npm audit

# Update dependencies
npm update
npm audit fix
```

## 📋 Security Checklist for PRs

Before submitting a PR, ensure:

- [ ] No secrets or credentials in code
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Security tests added (if applicable)
- [ ] Documentation updated (if security-related)

## 🔄 Security Updates

- **Critical**: Patched within 24-48 hours
- **High**: Patched within 1 week
- **Medium**: Patched within 1 month
- **Low**: Addressed in next release cycle

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

## 🏆 Security Acknowledgments

We appreciate responsible disclosure. Contributors who report valid security vulnerabilities will be:

- Acknowledged in our security advisories (if desired)
- Listed in our SECURITY.md (if desired)
- Given credit in release notes

## 📞 Contact

For security-related questions or concerns:
- **Email**: security@yhealth.app
- **Response Time**: Within 48 hours

---

**Thank you for helping keep yHealth secure!**


# /security

Trigger the **security-audit** skill.

Use when you want to audit the project for security vulnerabilities, dependency
risks, or unsafe coding patterns.

## How to Use

```
/security              — run a full security audit
/security deps         — audit dependencies only
/security code         — scan source code for vulnerabilities
/security secrets      — check for leaked secrets or credentials
```

Examples:
- `/security`
- `/security deps`
- `/security secrets`

## What Happens

1. Scan dependencies for known vulnerabilities (npm audit, pip-audit, etc.)
2. Search source for hardcoded secrets, tokens, or credentials
3. Check for common vulnerability patterns (injection, auth bypass, etc.)
4. Review HTTP security headers and configuration
5. Produce a Security Audit Report

## Output

A **Security Audit Report** listing vulnerabilities by severity (Critical,
High, Medium, Low), affected files, and recommended fixes.

## Skill Reference

See `skills/security-audit/SKILL.md` (when available) for the full protocol.

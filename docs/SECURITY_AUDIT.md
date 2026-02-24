# Security Audit (Week 8.5)

Date: 2026-02-24

## Scope

- API authentication and runtime configuration
- Default production exposure surface
- Brute-force protection on login endpoint

## Findings and Actions

1. Password hashing used legacy salted SHA-256.
   - Action: switched default hashing to bcrypt (12 rounds).
   - Action: added backward-compatible verification for legacy hashes.
   - Action: automatic hash migration on successful login.

2. Login endpoint had no brute-force throttling.
   - Action: added in-memory rate limiting by `email + ip`.
   - Defaults: 5 failed attempts per 15 minutes.
   - Configurable via `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX_ATTEMPTS`.

3. Production runtime had permissive defaults.
   - Action: tightened `JWT_SECRET` requirements (>=16 chars, >=32 in production).
   - Action: added `CORS_ORIGINS` allowlist config for production CORS.
   - Action: disabled Swagger docs by default in production (`ENABLE_API_DOCS=false` unless explicitly enabled).

4. Password policy baseline was weak.
   - Action: minimum password length raised from 6 to 8.

## Validation

- Unit tests added/updated for:
  - bcrypt + legacy password verification
  - legacy hash migration on login
  - login rate limiter behavior
- Full workspace test/typecheck/build gate passed.

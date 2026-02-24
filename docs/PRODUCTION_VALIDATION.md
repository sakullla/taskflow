# Production Deployment Validation (Week 8.8)

Date: 2026-02-24

## Goal

Ensure production deployment is healthy, secure, and ready for release after rollout.

## Automated checks

Run:

```bash
export BASE_URL=https://todo.example.com
bash ./scripts/validate-production.sh
```

The script verifies:

- `/health` returns `status=ok`
- Web entry (`/`) responds with HTTP 200
- Protected API endpoint (`/api/lists`) returns HTTP 401 without token
- Security headers (HSTS, `X-Content-Type-Options`) are present
- TLS certificate remaining validity is above threshold (`MIN_CERT_DAYS`, default 15)

## Manual checks

1. Open web app and complete one end-to-end flow:
   - login/register
   - create task
   - complete task
2. Confirm timezone-sensitive behavior:
   - check "today" / reminder logic under configured `TZ`
3. Confirm backup job can run:
   - `npm run backup`
4. Confirm container health:
   - `docker-compose -f docker-compose.yml -f docker-compose.tls.yml ps`
5. Confirm logs have no repeating error patterns:
   - `docker-compose -f docker-compose.yml -f docker-compose.tls.yml logs --tail=200`

## Rollback readiness

- Keep previous `IMAGE_TAG` available.
- Rollback command:

```bash
docker-compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

with `.env` reverted to the previous `IMAGE_TAG`.

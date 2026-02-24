#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://localhost}"
HEALTH_PATH="${HEALTH_PATH:-/health}"
ALLOW_INSECURE_TLS="${ALLOW_INSECURE_TLS:-true}"
MIN_CERT_DAYS="${MIN_CERT_DAYS:-15}"

green='\033[0;32m'
red='\033[0;31m'
yellow='\033[1;33m'
reset='\033[0m'

pass() {
  echo -e "${green}[PASS]${reset} $1"
}

fail() {
  echo -e "${red}[FAIL]${reset} $1"
}

warn() {
  echo -e "${yellow}[WARN]${reset} $1"
}

curl_flags=(--silent --show-error --location --max-time 15)
if [[ "$ALLOW_INSECURE_TLS" == "true" ]]; then
  curl_flags+=(--insecure)
fi

fail_count=0

health_body="$(curl "${curl_flags[@]}" "$BASE_URL$HEALTH_PATH" || true)"
if [[ "$health_body" == *"\"status\":\"ok\""* ]]; then
  pass "Health endpoint is healthy at $BASE_URL$HEALTH_PATH"
else
  fail "Health endpoint did not return status=ok"
  fail_count=$((fail_count + 1))
fi

root_code="$(curl "${curl_flags[@]}" --output /dev/null --write-out '%{http_code}' "$BASE_URL/" || true)"
if [[ "$root_code" == "200" ]]; then
  pass "Web entry responds with HTTP 200"
else
  fail "Web entry returned HTTP $root_code"
  fail_count=$((fail_count + 1))
fi

api_code="$(curl "${curl_flags[@]}" --output /dev/null --write-out '%{http_code}' "$BASE_URL/api/lists" || true)"
if [[ "$api_code" == "401" ]]; then
  pass "Protected API route returns expected HTTP 401 without token"
else
  fail "Protected API route returned HTTP $api_code (expected 401)"
  fail_count=$((fail_count + 1))
fi

headers="$(curl "${curl_flags[@]}" --head "$BASE_URL/" || true)"
if echo "$headers" | grep -iq "strict-transport-security"; then
  pass "HSTS header is present"
else
  warn "HSTS header is missing"
fi

if echo "$headers" | grep -iq "x-content-type-options: *nosniff"; then
  pass "X-Content-Type-Options header is present"
else
  warn "X-Content-Type-Options header is missing"
fi

if [[ "$BASE_URL" == https://* ]]; then
  if command -v openssl >/dev/null 2>&1; then
    host="$(echo "$BASE_URL" | sed -E 's#https://([^/:]+).*#\1#')"
    cert_end="$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2 || true)"
    if [[ -n "$cert_end" ]]; then
      now_ts="$(date +%s)"
      cert_ts="$(date -d "$cert_end" +%s 2>/dev/null || true)"
      if [[ -n "$cert_ts" ]]; then
        days_left=$(( (cert_ts - now_ts) / 86400 ))
        if (( days_left >= MIN_CERT_DAYS )); then
          pass "TLS certificate is valid for $days_left more day(s)"
        else
          fail "TLS certificate expires in $days_left day(s), threshold=$MIN_CERT_DAYS"
          fail_count=$((fail_count + 1))
        fi
      else
        warn "Unable to parse certificate expiry date: $cert_end"
      fi
    else
      warn "Unable to read TLS certificate from $host:443"
    fi
  else
    warn "openssl not found, skipping certificate expiry check"
  fi
fi

if (( fail_count > 0 )); then
  echo ""
  echo "Production validation failed with $fail_count error(s)."
  exit 1
fi

echo ""
echo "Production validation checks passed."

#!/usr/bin/env bash
# CI guard: ensure createServiceClient() is only imported from approved files.
# Prevents accidental bypassing of RLS via service role in unauthorized modules.
#
# Allowlist:
#   - lib/supabase/service.ts         (definition)
#   - lib/auth/account-actions.ts     (account deletion, re-auth required)
#   - lib/auth/heal-profile.ts        (self-healing missing profile, service role needed)
#   - lib/telegram/db.ts              (Telegram bot DB access, scoped queries)
#   - lib/reports/anonymous-actions.ts (anonymous report creation, IP rate-limited)
#   - lib/conversations/migrate.ts    (report linking during signup migration)
#   - lib/booking/google-calendar.ts  (Google Calendar API token management)
#   - lib/booking/admin-queries.ts    (admin dashboard booking queries)
#   - lib/booking/availability-actions.ts (admin availability config save)

set -euo pipefail

ALLOWLIST=(
  "lib/supabase/service.ts"
  "lib/auth/account-actions.ts"
  "lib/auth/heal-profile.ts"
  "lib/telegram/db.ts"
  "lib/reports/anonymous-actions.ts"
  "lib/conversations/migrate.ts"
  "lib/booking/google-calendar.ts"
  "lib/booking/admin-queries.ts"
  "lib/booking/availability-actions.ts"
)

# Build grep exclusion pattern
EXCLUDE_ARGS=()
for file in "${ALLOWLIST[@]}"; do
  EXCLUDE_ARGS+=(--exclude="$file")
done

# Search for createServiceClient imports in .ts/.tsx files
VIOLATIONS=$(grep -rn "createServiceClient" \
  --include="*.ts" --include="*.tsx" \
  "${EXCLUDE_ARGS[@]}" \
  lib/ app/ components/ 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Unauthorized createServiceClient() imports found:"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "Only these files may import createServiceClient():"
  for file in "${ALLOWLIST[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "If this is intentional, add the file to the allowlist in scripts/check-service-client.sh"
  exit 1
fi

echo "✅ Service client access control: all imports are authorized"

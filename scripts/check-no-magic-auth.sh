#!/bin/bash
# Verify auth error/success codes are referenced via constants, not string literals.
# Catches SSOT violations where someone writes 'rate_limited' instead of AUTH_ERROR.RATE_LIMITED.

set -euo pipefail

# Auth error/success values that must use constants (from lib/auth/types.ts)
PATTERNS="'validation'\|'invalid_credentials'\|'signup_failed'\|'unauthorized'\|'wrong_password'\|'update_failed'\|'reset_failed'\|'delete_failed'\|'email_update_failed'\|'rate_limited'\|'passwords_dont_match'\|'same_password'\|'sent'\|'password_changed'\|'email_confirmation_sent'"

# Search in source files, exclude the SSOT definition and test files
FOUND=$(grep -rn "$PATTERNS" \
  lib/ components/ app/ \
  --include='*.ts' --include='*.tsx' \
  | grep -v 'lib/auth/types\.ts' \
  | grep -v '\.test\.' \
  | grep -v 'node_modules' \
  || true)

if [ -n "$FOUND" ]; then
  echo "Magic auth strings found (use AUTH_ERROR/AUTH_SUCCESS constants):"
  echo "$FOUND" | sed 's/^/  /'
  exit 1
fi

echo "No magic auth strings found"
exit 0

#!/bin/bash
# Verify that en.json and fr.json have identical key structures.
# Catches missing translations before they reach production.

set -euo pipefail

EN="messages/en.json"
FR="messages/fr.json"

if [ ! -f "$EN" ] || [ ! -f "$FR" ]; then
  echo "Error: message files not found"
  exit 1
fi

EN_KEYS=$(jq -r '[paths(scalars)] | map(join(".")) | sort[]' "$EN")
FR_KEYS=$(jq -r '[paths(scalars)] | map(join(".")) | sort[]' "$FR")

MISSING_IN_FR=$(comm -23 <(echo "$EN_KEYS") <(echo "$FR_KEYS") || true)
MISSING_IN_EN=$(comm -13 <(echo "$EN_KEYS") <(echo "$FR_KEYS") || true)

EXIT=0

if [ -n "$MISSING_IN_FR" ]; then
  echo "Keys in en.json missing from fr.json:"
  echo "$MISSING_IN_FR" | sed 's/^/  /'
  EXIT=1
fi

if [ -n "$MISSING_IN_EN" ]; then
  echo "Keys in fr.json missing from en.json:"
  echo "$MISSING_IN_EN" | sed 's/^/  /'
  EXIT=1
fi

if [ $EXIT -eq 0 ]; then
  echo "i18n parity check passed ($(echo "$EN_KEYS" | wc -l | tr -d ' ') keys)"
fi

exit $EXIT

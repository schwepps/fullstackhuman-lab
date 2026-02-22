#!/bin/bash
# SEO/Discovery Data Consistency Check
# Verifies that personas, URLs, and schema data stay in sync across
# llms.txt, JSON-LD schemas, WebMCP registration, and translation files.
#
# Usage: pnpm check:seo

set -euo pipefail

ERRORS=0

echo "Checking SEO/discovery data consistency..."
echo ""

# --- 1. Persona names in llms.txt must match translation keys ---
echo "  [1/4] Persona names in llms.txt..."
PREV_ERRORS=$ERRORS
for persona in doctor critic guide; do
  if ! grep -q "\"$persona\"" messages/en.json; then
    echo "    ✘ Persona '$persona' not found in messages/en.json"
    ERRORS=$((ERRORS + 1))
  fi
done

for name in "Doctor" "Critic" "Guide"; do
  if ! grep -q "$name" public/llms.txt; then
    echo "    ✘ '$name' not mentioned in public/llms.txt"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq $PREV_ERRORS ]; then
  echo "    ✔ All personas consistent"
fi

# --- 2. APP_URL consistency ---
echo "  [2/4] APP_URL references..."
EXPECTED_URL="fullstackhuman.com"
PREV_ERRORS=$ERRORS

# Check the SSOT constant file exists and has the URL
if [ -f "lib/constants/app.ts" ]; then
  if ! grep -q "$EXPECTED_URL" "lib/constants/app.ts"; then
    echo "    ✘ lib/constants/app.ts does not reference $EXPECTED_URL"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "    ✘ lib/constants/app.ts not found (APP_URL SSOT)"
  ERRORS=$((ERRORS + 1))
fi

# Check consumers import from the SSOT or reference the URL
for file in "app/robots.ts" "app/sitemap.ts" "lib/seo/schemas.ts" "app/[locale]/layout.tsx"; do
  if [ -f "$file" ] && ! grep -q "$EXPECTED_URL\|@/lib/constants/app" "$file"; then
    echo "    ✘ $file does not reference $EXPECTED_URL or import APP_URL"
    ERRORS=$((ERRORS + 1))
  fi
done

if ! grep -q "$EXPECTED_URL" public/llms.txt; then
  echo "    ✘ public/llms.txt does not reference $EXPECTED_URL"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq $PREV_ERRORS ]; then
  echo "    ✔ APP_URL consistent across all files"
fi

# --- 3. WebMCP persona data uses shared constants ---
echo "  [3/4] WebMCP persona alignment..."
PREV_ERRORS=$ERRORS
WEBMCP_FILE="components/seo/webmcp-registration.tsx"
if [ -f "$WEBMCP_FILE" ]; then
  if ! grep -q "SEO_PERSONAS\|PERSONA_IDS" "$WEBMCP_FILE"; then
    echo "    ✘ $WEBMCP_FILE does not import from persona constants (SSOT)"
    ERRORS=$((ERRORS + 1))
  fi
  if [ $ERRORS -eq $PREV_ERRORS ]; then
    echo "    ✔ WebMCP personas aligned"
  fi
else
  echo "    ⚠ $WEBMCP_FILE not found (WebMCP not implemented)"
fi

# --- 4. JSON-LD schema exports are consumed ---
echo "  [4/4] JSON-LD schema usage..."
PREV_ERRORS=$ERRORS
SCHEMA_FILE="lib/seo/schemas.ts"
if [ -f "$SCHEMA_FILE" ]; then
  EXPORTS=$(grep -oE 'export function (get\w+)' "$SCHEMA_FILE" | awk '{print $3}')
  for fn in $EXPORTS; do
    USAGE_COUNT=$(grep -rl "$fn" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "$SCHEMA_FILE" | wc -l | tr -d ' ')
    if [ "$USAGE_COUNT" -eq 0 ]; then
      echo "    ✘ Schema function '$fn' is exported but never used in app/ or components/"
      ERRORS=$((ERRORS + 1))
    fi
  done
  if [ $ERRORS -eq $PREV_ERRORS ]; then
    echo "    ✔ All schema exports consumed"
  fi
else
  echo "    ✘ $SCHEMA_FILE not found"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "✘ SEO consistency check failed with $ERRORS error(s)"
  exit 1
else
  echo "✔ SEO consistency check passed"
fi

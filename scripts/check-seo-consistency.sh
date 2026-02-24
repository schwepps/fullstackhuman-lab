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
echo "  [1/5] Persona names in llms.txt..."
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
echo "  [2/5] APP_URL references..."
EXPECTED_URL="fullstackhuman.sh"
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
echo "  [3/5] WebMCP persona alignment..."
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
echo "  [4/5] JSON-LD schema usage..."
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

# --- 5. Persona descriptions in SEO_PERSONAS match messages/en.json ---
echo "  [5/5] Persona description alignment..."
PREV_ERRORS=$ERRORS
PERSONA_FILE="lib/constants/personas.ts"
if [ -f "$PERSONA_FILE" ] && [ -f "messages/en.json" ]; then
  # Extract description substrings from SEO_PERSONAS and verify they appear in en.json
  # We check key phrases rather than exact matches to tolerate minor formatting differences
  for phrase in "finds the root cause" "what works, what doesn" "a new way to see your question"; do
    if ! grep -q "$phrase" "$PERSONA_FILE"; then
      echo "    ✘ Phrase '$phrase' not found in $PERSONA_FILE"
      ERRORS=$((ERRORS + 1))
    fi
    if ! grep -q "$phrase" "messages/en.json"; then
      echo "    ✘ Phrase '$phrase' not found in messages/en.json (description drift)"
      ERRORS=$((ERRORS + 1))
    fi
  done
  if [ $ERRORS -eq $PREV_ERRORS ]; then
    echo "    ✔ Persona descriptions aligned"
  fi
else
  echo "    ✘ Missing $PERSONA_FILE or messages/en.json"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "✘ SEO consistency check failed with $ERRORS error(s)"
  exit 1
else
  echo "✔ SEO consistency check passed"
fi

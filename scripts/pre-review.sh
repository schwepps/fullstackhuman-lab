#!/bin/bash
# Pre-review quality gate: run all automated checks before opening a PR.
# Usage: pnpm pre-review

set -euo pipefail

echo ""
echo "=== i18n parity ==="
bash scripts/check-i18n-parity.sh

echo ""
echo "=== Magic auth strings ==="
bash scripts/check-no-magic-auth.sh

echo ""
echo "=== SEO consistency ==="
bash scripts/check-seo-consistency.sh

echo ""
echo "=== Service client access control ==="
bash scripts/check-service-client.sh

echo ""
echo "=== Copy-paste detection ==="
pnpm check:duplicates

echo ""
echo "=== Lint ==="
pnpm lint

echo ""
echo "=== Typecheck ==="
pnpm typecheck

echo ""
echo "=== Tests ==="
pnpm test:run

echo ""
echo "=== All pre-review checks passed ==="

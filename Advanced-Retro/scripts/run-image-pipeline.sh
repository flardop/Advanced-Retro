#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npm run -s images:setup
npm run -s images:organize
npm run -s images:mapping:template
npm run -s images:cluster
npm run -s images:mapping:dedupe
npm run -s images:seed:pending-products
npm run -s images:mapping:autofill
npm run -s images:mapping:apply
npm run -s images:upload

echo "Pipeline completado."

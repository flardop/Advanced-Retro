#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d ".venv-imaging" ]; then
  python3 -m venv .venv-imaging
fi

. .venv-imaging/bin/activate
python -m pip install --upgrade pip >/dev/null
python -m pip install pillow imagehash pillow-heif >/dev/null

echo "Image tools ready in $ROOT_DIR/.venv-imaging"


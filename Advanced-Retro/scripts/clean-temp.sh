#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DRY_RUN="${1:-}"

trash_paths=(
  ".next"
  "out"
  "build"
  "dist"
  "coverage"
  ".turbo"
  ".cache"
  ".playwright-cli"
  "tmp"
  "docs/reports"
  "Imagenes/Organizadas"
  "Imagenes_local_backup"
  ".venv-imaging"
)

content_only_paths=(
  "automation/make-gaming-news/video-worker/output"
)

file_patterns=(
  ".eslintcache"
  "*.tsbuildinfo"
  "npm-debug.log*"
  "yarn-debug.log*"
  "yarn-error.log*"
  "pnpm-debug.log*"
  "*.tmp"
  "*.temp"
)

announce() {
  printf '%s\n' "$1"
}

remove_path() {
  local absolute_path="$1"
  local relative_path="$2"

  if [[ ! -e "$absolute_path" ]]; then
    return
  fi

  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    announce "would remove ${relative_path}"
    return
  fi

  rm -rf "$absolute_path"
  announce "removed ${relative_path}"
}

remove_dir_contents() {
  local absolute_path="$1"
  local relative_path="$2"
  local entry=""
  local found_entries=0

  if [[ ! -d "$absolute_path" ]]; then
    return
  fi

  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    while IFS= read -r entry; do
      [[ -n "$entry" ]] || continue
      found_entries=1
      announce "would clean ${relative_path}"
      break
    done < <(find "$absolute_path" -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -print)
    return
  fi

  while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    found_entries=1
    rm -rf "$entry"
  done < <(find "$absolute_path" -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -print)

  if [[ "$found_entries" -eq 1 ]]; then
    announce "cleaned ${relative_path}"
  fi
}

find_pattern_matches() {
  local args=()
  local first=1
  local pattern

  for pattern in "${file_patterns[@]}"; do
    if [[ "$first" -eq 1 ]]; then
      args+=(-name "$pattern")
      first=0
    else
      args+=(-o -name "$pattern")
    fi
  done

  find "$PROJECT_ROOT" \
    -path "$PROJECT_ROOT/.git" -prune -o \
    -type f \( "${args[@]}" \) -print
}

announce "Cleaning temporary artifacts in ${PROJECT_ROOT}"

for relative_path in "${trash_paths[@]}"; do
  remove_path "${PROJECT_ROOT}/${relative_path}" "$relative_path"
done

for relative_path in "${content_only_paths[@]}"; do
  remove_dir_contents "${PROJECT_ROOT}/${relative_path}" "$relative_path"
done

while IFS= read -r matched_file; do
  [[ -n "$matched_file" ]] || continue
  remove_path "$matched_file" "${matched_file#${PROJECT_ROOT}/}"
done < <(find_pattern_matches)

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  announce "Dry run complete."
else
  announce "Cleanup complete."
fi

# Icons Migration Notes

This document tracks existing Lottie icon assets and where they should live in the new organized structure.

## Existing

- `assets/Icons/successIcon/success.json`
  - Purpose: success animation overlay used across the app.
  - New home: `assets/Icons/system-engagement/badge-earned.json` or `assets/Icons/system-engagement/trophy.json`
  - Action: either rename to a semantic name (`badge-earned.json`) and move to `system-engagement/`, or keep original filename temporarily and update references later.

- `assets/Icons/logsicon/` (if present)
  - Purpose: log/chart-related animations.
  - New home: `assets/Icons/bottom-navigation/chart.json` or `assets/Icons/bottom-navigation/log-graph.json`

## Guidance

- Rename files to semantic, kebab-case names that match the UI usage (e.g., `blood-sugar.json`).
- Avoid duplicating similar icons across multiple folders; choose the most appropriate context folder.
- When moving files, update all import paths in code. Consider a central mapping file to reduce breakage.

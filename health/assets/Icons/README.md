# Lottie Icons Directory

This directory contains all Lottie JSON animations used as icons across the main app UI. Icons are grouped by usage context to keep the project organized and scalable.

Do not place onboarding assets here. This folder is for the main app only.

## Structure

- bottom-navigation/
- monitoring-tools/
- nutrition/
- prevention-lifestyle/
- system-engagement/

Each sub-folder includes a README with the intended use and suggested filenames.

## Naming Conventions

- Use lowercase kebab-case for file names, e.g., `blood-sugar.json`.
- Prefer semantic names matching UI usage, not vendor names.
- Keep file sizes optimized. Avoid excessive looping/particles for small icons.

## Platform Notes

- Native: rendered via `lottie-react-native`.
- Web: provide a fallback (static frame/emoji) if needed.
- Reduced Motion: animations should be optional; the UI must remain usable when disabled.

## Versioning

- If replacing an animation, keep the old file until all references are migrated, or create `*-v2.json` temporarily.


# Development baseline

The v0.16.0 release is a localization and source-organization milestone, not a gameplay redesign. Preserve the existing v15 mechanics when making changes to translations or the build pipeline.

## Localization

- `L(key)` resolves player-facing messages. `R(key)` resolves language-specific regular expressions. See `src/localization.js` for exact API.
- Preserve matching catalog keys, interpolation variables and language rule identifiers.
- Keep canonical facts independent of display text. The model response protocol uses English field names and enumerated values in both locales; natural-language responses follow the selected locale.
- Proper names and legacy case IDs are stable, even if they contain Portuguese words.
- Built-in cases are available in both languages. User-generated cases are stored by language and are not auto-translated.

## Regression

`npm test` checks locale coverage and performs deterministic offline engine tests. `tests/v15-baseline.json` records the original input HTML SHA-256 and 120 reference snapshot hashes for original seeds 0–59 in each mode. Snapshot comparisons include the accepted seed, case ID, culprit, crime location and time, historical positions, weather/deadlines, claims and verified proof. Display prose is excluded. Changing gameplay intentionally may require a new reference suite; do not overwrite the historical v15 baseline simply to silence a regression.

The runtime remains a single HTML file for convenient distribution. Build using `npm run build`. CI verifies the committed build is current.

## Deferred work

Known v15 gameplay concerns (historical route continuity, ambiguity of board deductions, behavior cues, NPC relocation during dialogue, lexical filter limitations and performance) have not been redesigned in this release. They are candidates for independent follow-up changes. Live model inference and real-device performance require additional testing before a wider release.

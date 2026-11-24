# Development

The v0.16.0 release establishes the bilingual development baseline. Keep localization and build changes independent of gameplay changes.

## Local setup

Node.js 20 or later is required for development; no npm dependencies are needed.

```sh
npm test
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/#en` or `http://localhost:8000/#pt-BR`. Python is only needed for this optional local HTTP server.

## Project structure

```text
src/
  engine.js          Procedural world, evidence and solvers
  game.js            Gameplay, social and strategic systems
  ui.js              Interface, persistence and AI integration
  localization.js    Locale loading and formatting
  layout.html        Interface structure
  style.css          Visual design
locales/
  en.json            English messages and language rules
  pt-BR.json         Brazilian Portuguese messages and language rules
scripts/build.js     Standalone HTML builder
tests/               Engine and localization regression tests
index.html           Generated playable build
```

The runtime is distributed as a single HTML file. Edit the source modules and locale catalogs, then rebuild `index.html` and commit it with the sources. CI checks the tests and build consistency.

## Gameplay and localization conventions

- The player-facing Normal and Advanced modes correspond to the internal IDs `mvp` and `advanced`. The historical v15 fixtures use `avancado` for Advanced; the regression runner maps this to `advanced`.
- Use English for implementation identifiers, comments and internal protocol fields.
- `L(key)` resolves player-facing messages. `R(key)` resolves language-specific regular expressions. See `src/localization.js` for the exact API.
- Update both catalogs together, preserving matching keys, interpolation variables and rule identifiers.
- Keep canonical facts independent of display text. Model response fields and enumerated values use English in both locales.
- Preserve proper names and stable legacy IDs. Built-in cases are bilingual; user-generated cases are stored in the language in which they were created.

## AI integration

AI is optional. The game engine controls the culprit, canonical testimony, evidence and game rules. The model proposes dialogue, conversational approaches and authorized actions; response validators and local fallbacks handle invalid outputs. Lexical filtering does not guarantee semantic consistency.

The browser sends requests directly to OpenRouter, using a user-supplied key stored in localStorage. Dialogue and relevant context may be sent to the provider. Never commit API credentials. Generated cases can be backed up locally; backups may contain spoilers.

## Tests

`npm test` runs the offline suite in both languages:

- Checks matching catalog keys and language rules, regular expression syntax and literal localization references.
- Compares 120 seed/mode pairs (seeds 0–59 in each mode) across both languages, including accepted seeds, culprit, crime location and time, historical positions, deadlines, claims and verified routes.
- Compares the resulting snapshots with `tests/v15-baseline.json`. Display prose is excluded from these snapshots.
- Starts each of the six built-in stories with seed 123 in each mode and language and checks the returned case ID. Game initialization invokes the route verifier; these checks do not separately assert proof details for each built-in story.
- Checks generated case fixtures, local question interpretation and model response parsers.

The baseline includes a provenance hash of the original v15 HTML. That source file is not distributed in this repository, so the source hash cannot be independently checked from this checkout. The snapshot hashes are used by the regression runner. Preserve the historical fixtures; intentional gameplay changes may warrant a separate baseline.

Live model inference, browser interaction and real-device performance are outside the offline suite.

## Future development

Potential improvements to evaluate independently:

- Continuity of historical character routes.
- Distinguishing plausible deductions from conclusive ones.
- Reducing predictable behavioral cues.
- Dialogue continuity when NPCs relocate.
- Improving natural-language response validation.
- Rendering performance and mobile testing.

These are development candidates, not changes included in v0.16.0.

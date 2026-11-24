# Mystery in the Square — Mistério na Praça

[Português (Brasil)](README.pt-BR.md) · [Play in English](index.html#en) · [Jogar em português](index.html#pt-BR)

A procedural detective game set at Praça Coronel Pedro Osório, in Pelotas, Rio Grande do Sul, Brazil. Investigate a crime in a square that gradually loses its lights. Interview witnesses, compare accounts, collect physical evidence, and decide whom to accuse before the blackout is complete.

The game uses a green monochrome terminal-inspired interface, an emoji map and touch controls designed for portrait-oriented mobile screens. Cláudio, Christopher, Lu, Seu Bento, the Fiscal, Dona Tereza, Guri do Mate and the Leitor retain their original identities and local setting in both languages.

The Brazilian Portuguese dialogue deliberately uses regional expressions and slang associated with Pelotas and southern Brazil, including *bah*, *guri* and colloquial uses of *tu*. The English edition adapts the dialogue while preserving the characters and Brazilian setting.

## Fictional setting and characters

While the game is set in the real city of Pelotas, Brazil, and incorporates local landmarks, cultural references and elements inspired by everyday life, its characters are fictionalized. All crimes, investigations, motives, accusations and outcomes are fictional and should not be interpreted as statements about real people or events.

## Playing

Open `index.html` in a modern browser, or serve this repository over HTTP. Choose English or Brazilian Portuguese on the opening screen. The language can also be selected with `#en` or `#pt-BR` in the URL. Portuguese is the default. Changing language during a game starts a new game after confirmation.

- Choose Normal or Advanced mode, or select a case from the mystery library.
- Move with the circular joystick; examine places and talk to people nearby.
- Use Christopher to investigate scents, and consult Lu about your notes.
- Manage time, energy and sanity. Compare testimony and physical clues in the diary, or make a direct accusation.
- The six built-in stories and deterministic case generation work without an AI service.

## Optional AI inference

The game can use OpenRouter for free-form dialogue, social interaction, conversations between NPCs, case generation and epilogues. Open the AI settings, enter your own API key and choose a model. The default model identifier is `openrouter/free`; its availability and limits depend on the provider. Conventional investigation and the local dialogue fallback work without a key.

The game engine, not the language model, determines the culprit, facts, evidence and canonical testimony. Model proposals are checked before use. Lexical filters are not a semantic guarantee against misleading dialogue.

API requests go directly from the browser to OpenRouter. The key is stored in browser localStorage, not bundled with the game. Use a restricted, disposable key and never commit credentials. Free-form questions and relevant game context, including recent conversation memory, are sent to the provider when inference is enabled. Do not enter personal or confidential information. Model usage is subject to provider terms and pricing.

Generated cases are stored locally by language and can be backed up. They are created in the selected language; they are not automatically translated into the other language. Backups can contain spoilers.

## Development

Node.js 20 or later; no npm dependencies are required. The generated HTML can be played without Node.js.

```sh
npm test
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/#en` or `http://localhost:8000/#pt-BR`.

```text
src/
  engine.js          Procedural world, evidence and solvers
  game.js            Gameplay, social and strategic systems
  ui.js              Interface, persistence and AI integration
  localization.js    Locale loading and formatting
  layout.html        Interface structure
  style.css          Visual design
locales/
  en.json            English text and language rules
  pt-BR.json         Brazilian Portuguese text and language rules
scripts/build.js     Standalone HTML builder
tests/               Regression and localization tests
index.html           Generated, self-contained playable release
```

Use English for implementation identifiers, comments and internal protocol fields. Keep player-facing prose and language-specific parsing rules in both locale catalogs. Proper names and stable legacy IDs are preserved. Update both catalogs when adding messages or changing interpolation placeholders. Do not edit the generated `index.html` directly; rebuild it and commit it alongside the sources.

The regression suite checks 120 original v15 seed/mode snapshots, cross-language equality of generated worlds and verified routes, the six built-in stories, generated case fixtures, local dialogue and model response validators. These are automated offline tests, not a guarantee of model quality or playability on every device. See [development notes](docs/DEVELOPMENT.md).

## GitHub Pages

Commit the repository contents, including the generated `index.html`, to the `main` branch. In GitHub, open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then `main` and `/(root)`. Once deployed, append `#en` or `#pt-BR` to the Pages URL. The supplied CI workflow runs tests and checks that the generated HTML matches the sources.

## Status and license

Version 0.16.0 is a bilingual development baseline derived from playtested prototype v15. Its mechanics and world-generation behavior are deliberately preserved rather than redesigned. The project is licensed under the MIT License; see [LICENSE](LICENSE).

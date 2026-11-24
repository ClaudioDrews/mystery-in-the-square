<p align="center"><img src="docs/banner.jpg" alt="Mystery in the Square" width="100%"></p>

# Mystery in the Square

[Português (Brasil)](README.pt-BR.md) · **[Play in English](https://claudiodrews.github.io/mystery-in-the-square/#en)** · [Jogar em português](https://claudiodrews.github.io/mystery-in-the-square/#pt-BR)

Night falls over Praça Coronel Pedro Osório, in Pelotas, southern Brazil. A crime needs solving, and the streetlights are going out one by one.

Play as Cláudio, investigate with your dog Christopher, and discuss your discoveries with Lu. Question suspects, piece together conflicting stories and collect evidence before the square goes dark.

## Features

- Procedurally generated mysteries across six original scenarios.
- Characters with distinct personalities, memories and social dynamics.
- Evidence collection, interrogation and a deduction board.
- Normal and Advanced modes, progressive blackouts and resource management.
- Optional AI-powered conversations, new mysteries and epilogues.
- Retro green terminal aesthetic, emoji map and mobile-friendly touch controls.
- English and Brazilian Portuguese. The Portuguese dialogue features regional slang and expressions from Pelotas.

## How to play

Explore the square, speak to nearby characters, use Christopher to investigate scents and review clues in your diary. Consult Lu when you need a second perspective, and accuse a suspect when you are ready.

You can play without an API key. To play locally, download the repository and open `index.html` in your browser.

## Optional AI

Open **AI Settings**, enter your [OpenRouter](https://openrouter.ai/) API key and choose a model. AI enables more flexible dialogue and lets you generate new stories for your mystery library. The game engine determines the facts and evidence in each case.

Your key is stored in your browser. AI requests send dialogue and relevant game context to OpenRouter; avoid entering sensitive information. Model usage may incur charges.

## Development

Requires Node.js 20 or later. No npm dependencies.

```sh
npm test
npm run build
python3 -m http.server 8000
```

See [development notes](docs/DEVELOPMENT.md) for architecture, localization and tests.

## Fictional setting

The game takes place in a real city, but its characters are fictionalized. All crimes, investigations, motives, accusations and outcomes are fictional and should not be interpreted as statements about real people or events.

## License

[MIT](LICENSE)

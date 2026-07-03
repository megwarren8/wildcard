# WILDCARD: Ice-Breaker Slot Machine

Designed and built by [Megan Warren](https://github.com/megwarren8).

A single-screen party game. Press **SPIN**, a slot-machine reel lands on a random
celebrity-interview question, you guess the answer out loud, then reveal what the
guest actually said. Built to live full-screen on a laptop or TV at a gathering.

Questions are drawn from *Hot Ones*, *Good Hang*, *SmartLess*, *New Heights*, *On Purpose*, and *Call Her Daddy* interview segments, all reworded so anyone playing can answer, guess, or riff on them without knowing who was originally asked.

## Run it

ES modules and `fetch()` need a real server (not `file://`), so:

```bash
./run.sh            # serves on http://localhost:8000
./run.sh 5173       # or pick a port
```

Then open the printed URL. No build step, no install: just Python 3 (already on macOS).

## How to play

- **SPIN** (or `Space` / `Enter`): draw a random question.
- **Reveal the answer** (or `R`): flip the card to see what the guest said.
- **← Back to question** (or `R`): flip back, then spin again.

## Settings

The gear in the top-right opens four settings (persisted in your browser):

| Setting | Options | Default |
|---|---|---|
| **Question pool** | Everything · On Purpose · Hot Ones | Everything |
| **Answer** | Guess first · Show answer | Guess first |
| **Spin time** | 1.2 to 4.0 s | 2.6 s |
| **Confetti** | On · Off | On |

Cosmetic options from the design prototype (theme, font, frame housing, idle mark)
are fixed to their chosen defaults: **Carnival** palette, **Bricolage Grotesque**,
**Console** frame, **Question-mark** idle mark.

## Project layout

```
wildcard/
├── index.html            # markup skeleton + font + module entry
├── css/
│   └── wildcard.css       # all styles (tokens, cards, reel, motion, settings)
├── js/
│   ├── app.js             # controller + state machine (entry module)
│   ├── data.js            # loads questions.json, source metadata, pool filter
│   ├── reel.js            # reel geometry + spin animation
│   ├── cards.js           # card / idle DOM builders
│   ├── confetti.js        # landing confetti burst
│   └── settings.js        # the four real settings + popover UI
├── data/
│   └── questions.json     # 190 universal ice-breaker questions (Hot Ones, Good Hang, SmartLess, and more)
└── run.sh                 # python3 -m http.server
```

## Notes

This is a production recreation of the design handoff prototype. It drops the
prototype's in-browser Babel and `window.QUESTIONS` global in favour of a small
ES-module app that loads the question bank from `data/questions.json`. The colours,
typography, spacing, and motion timings match the handoff spec.

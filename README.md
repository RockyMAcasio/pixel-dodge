# Pixel Dodge

A browser survival game built with TypeScript, HTML Canvas, and CSS.
Move your character to dodge falling bananas and beat your high score.

## Play

[Play Pixel Dodge](https://rockymacasio.github.io/pixel-dodge/)

Keyboard required. Use a desktop or laptop browser.

## Controls

- Click **Start game** to begin.
- Use **Left/Right Arrow** or **A/D** to move.
- Avoid falling bananas.
- Click **Play again** after losing.

## Features

- Custom pixel-art character and bananas
- Retro typography and stepped game borders
- Collision detection and a game-over pose
- Survival-based scoring
- Increasing obstacle speed and spawn frequency
- High score saved locally in the browser
- Automatic deployment through GitHub Actions

## Technologies

- TypeScript — game logic, input handling, and game state
- HTML Canvas — drawing sprites and the game screen
- CSS — layout and pixel-themed interface
- Vite — development server and production build
- GitHub Pages — hosting

## Run locally

Requires Node.js and npm.

```bash
git clone https://github.com/RockyMAcasio/pixel-dodge.git
cd pixel-dodge
npm install
npm run dev
```

Open the local address printed in the terminal.

## Build

```bash
npm run build
```

The production files are generated in `dist`.

## How it works

The game uses `requestAnimationFrame` to repeatedly update and draw
the scene. Movement is calculated using elapsed time between frames.

Bananas are stored in an array, checked for collisions using rectangular
hitboxes, and removed when they leave the screen.

The game tracks three states: ready, playing, and game over.
High scores use localStorage and are specific to the browser and site.

## Credits

Uses the [Silkscreen font](https://fonts.google.com/specimen/Silkscreen).
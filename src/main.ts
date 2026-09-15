import './style.css';

// 1. PAGE SETUP
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main>
    <h1>PIXEL DODGE</h1>

    <div class="scoreboard">
      <div>
        <span class="score-label">SCORE</span>
        <strong id="score">0</strong>
      </div>
      <div>
        <span class="score-label">HIGH SCORE</span>
        <strong id="high-score">0</strong>
      </div>
    </div>

    <p>Move with ← → or A / D. Dodge the bananas!</p>

    <div class="pixel-frame">
  <canvas
    id="game"
    width="600"
    height="400"
    tabindex="0"
    aria-label="Pixel Dodge. Use left and right arrows to dodge bananas."
  ></canvas>
</div>

    <p id="status" role="status">Ready to dodge?</p>
    <button id="restart" type="button">Start game</button>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const scoreDisplay = document.querySelector<HTMLElement>('#score')!;
const highScoreDisplay = document.querySelector<HTMLElement>('#high-score')!;
const statusDisplay = document.querySelector<HTMLElement>('#status')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;

// 2. HIGH SCORE STORAGE
const storageKey = 'pixel-dodge-high-score';

function loadHighScore(): number {
  try {
    const saved = Number(localStorage.getItem(storageKey));

    return Number.isSafeInteger(saved) && saved >= 0 ? saved : 0;
  } catch {
    return 0;
  }
}

let highScore = loadHighScore();
highScoreDisplay.textContent = String(highScore);

function saveHighScore(): void {
  try {
    localStorage.setItem(storageKey, String(highScore));
  } catch {
    // The game still works if browser storage is unavailable.
  }
}

window.addEventListener('pagehide', saveHighScore);

// 3. PIXEL ART
// Each letter represents a colored pixel.
// A dot means transparent space.
const personSprite: string[] = [
  '..HHHH..',
  '.HHHHHH.',
  '..SSSS..',
  '..SESE..',
  '..SSSS..',
  '...SS...',
  '.TTTTTT.',
  'STTTTTTS',
  'S.TTTT.S',
  '..PPPP..',
  '..P..P..',
  '.BB..BB.',
];

const personColors: Record<string, string> = {
  H: '#38251c', // Hair
  S: '#efb283', // Skin
  E: '#182033', // Eyes
 T: '#ff4545', //  Shirt
  P: '#5278e8', // Pants
  B: '#edf3ff', // Shoes
};

const bananaSprite: string[] = [
  '......BB',
  '......GY',
  '.....LYY',
  '.....LYD',
  '....LYYD',
  '...LYYD.',
  '.LLYYYD.',
  'BYYYYD..',
  '.DDDD...',
];

const bananaColors: Record<string, string> = {
  B: '#72502b', // Stem and tip
  G: '#a3bc35', // Green near the stem
  L: '#fff3a1', // Highlight
  Y: '#ffd43b', // Banana yellow
  D: '#d99b20', // Shading
};

function drawSprite(
  sprite: string[],
  colors: Record<string, string>,
  x: number,
  y: number,
  scale: number,
): void {
  for (const [rowIndex, row] of sprite.entries()) {
    for (let column = 0; column < row.length; column++) {
      const pixel = row.charAt(column);
      const color = colors[pixel];

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x) + column * scale,
          Math.round(y) + rowIndex * scale,
          scale,
          scale,
        );
      }
    }
  }
}

// 4. PLAYER AND GAME DATA
const playerScale = 3;

const player = {
  x: 288,
  y: 352,
  width: 24,
  height: 36,
  speed: 320,
};

// 1 means facing right; -1 means facing left.
let facing: 1 | -1 = 1;

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  scale: number;
}

let obstacles: Obstacle[] = [];
let survivalTime = 0;
let spawnTimer = 0;
let score = 0;

type GameState = 'ready' | 'playing' | 'gameover';
let gameState: GameState = 'ready';

const keys = new Set<string>();

// 5. KEYBOARD CONTROLS
canvas.addEventListener('keydown', (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();

  if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (event: KeyboardEvent) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener('blur', () => keys.clear());
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', () => canvas.focus());

// 6. BANANAS AND COLLISIONS
function spawnObstacle(): void {
  const scale = 3 + Math.floor(Math.random() * 3);
  const width = 8 * scale;
  const height = 9 * scale;

  obstacles.push({
    x: Math.random() * (canvas.width - width),
    y: -height,
    width,
    height,
    speed: 150 + Math.min(survivalTime * 5, 250),
    scale,
  });
}

function isColliding(obstacle: Obstacle): boolean {
  // Slightly smaller hitboxes make the pixel art more forgiving.
  const playerInset = 4;
  const bananaInset = obstacle.scale * 2;

  return (
    player.x + playerInset <
      obstacle.x + obstacle.width - bananaInset &&
    player.x + player.width - playerInset >
      obstacle.x + bananaInset &&
    player.y + playerInset <
      obstacle.y + obstacle.height - bananaInset &&
    player.y + player.height >
      obstacle.y + bananaInset
  );
}

// 7. START OR RESTART
function startGame(): void {
  saveHighScore();

  player.x = (canvas.width - player.width) / 2;
  obstacles = [];
  survivalTime = 0;
  spawnTimer = 0;
  score = 0;
  keys.clear();

  gameState = 'playing';
  scoreDisplay.textContent = '0';
  statusDisplay.textContent = 'Watch out for the bananas!';
  restartButton.textContent = 'Restart game';

  canvas.focus();
}

restartButton.addEventListener('click', startGame);

// 8. UPDATE THE GAME
function update(deltaTime: number): void {
  if (gameState !== 'playing') {
    return;
  }

  survivalTime += deltaTime;
  score = Math.floor(survivalTime * 10);
  scoreDisplay.textContent = String(score);

  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = String(highScore);
  }

 let direction = 0;

if (keys.has('arrowleft') || keys.has('a')) {
  direction -= 1;
}

if (keys.has('arrowright') || keys.has('d')) {
  direction += 1;
}

// Remember the direction, even after releasing the key.
if (direction < 0) {
  facing = -1;
} else if (direction > 0) {
  facing = 1;
}

player.x += direction * player.speed * deltaTime;

  player.x = Math.max(
    0,
    Math.min(canvas.width - player.width, player.x),
  );

  const spawnInterval = Math.max(0.3, 0.9 - survivalTime * 0.01);
  spawnTimer += deltaTime;

  if (spawnTimer >= spawnInterval) {
    spawnObstacle();
    spawnTimer -= spawnInterval;
  }

  for (const obstacle of obstacles) {
    obstacle.y += obstacle.speed * deltaTime;

    if (isColliding(obstacle)) {
      gameState = 'gameover';
      saveHighScore();

      statusDisplay.textContent = `A banana got you! Final score: ${score}.`;
      restartButton.textContent = 'Play again';
      keys.clear();
      return;
    }
  }

  obstacles = obstacles.filter(
    (obstacle) => obstacle.y < canvas.height,
  );
}

// 9. DRAW THE GAME
function draw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // A simple floor beneath the character.
  ctx.fillStyle = '#293c56';
  ctx.fillRect(0, 390, canvas.width, 10);

  // Save the normal drawing settings.
ctx.save();

if (gameState === 'gameover') {
  // Keep the sideways character inside the screen.
  const halfLength = player.height / 2;

  const centerX = Math.max(
    halfLength,
    Math.min(
      canvas.width - halfLength,
      player.x + player.width / 2,
    ),
  );

  // Position the fallen character at his usual ground level.
  const centerY = player.y + player.height - player.width / 2;

  ctx.translate(Math.round(centerX), Math.round(centerY));

  // Fall onto his side, based on the direction he was facing.
  ctx.rotate(facing * Math.PI / 2);

  drawSprite(
    personSprite,
    personColors,
    -player.width / 2,
    -player.height / 2,
    playerScale,
  );
} else {
  // Normal standing pose, flipped according to movement.
  ctx.translate(
    Math.round(player.x) + (facing === -1 ? player.width : 0),
    Math.round(player.y),
  );

  ctx.scale(facing, 1);

  drawSprite(
    personSprite,
    personColors,
    0,
    0,
    playerScale,
  );
}

ctx.restore();

  for (const obstacle of obstacles) {
    drawSprite(
      bananaSprite,
      bananaColors,
      obstacle.x,
      obstacle.y,
      obstacle.scale,
    );
  }

  if (gameState !== 'playing') {
    ctx.fillStyle = 'rgba(11, 16, 32, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f0f4ff';
ctx.font = '32px "Silkscreen", monospace';
    ctx.textAlign = 'center';

    ctx.fillText(
      gameState === 'ready' ? 'READY TO DODGE?' : 'GAME OVER',
      canvas.width / 2,
      canvas.height / 2,
    );
  }
}

// 10. GAME LOOP
let previousTime = performance.now();

function gameLoop(currentTime: number): void {
  const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
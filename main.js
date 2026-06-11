import { animate } from "./anime.js";

const COLS = 6;
const ROWS = 4;
const TILE_COUNT = COLS * ROWS;

const board = document.getElementById("board");
const movesEl = document.getElementById("moves");
const newGameBtn = document.getElementById("newGameBtn");

let moves = 0;
let emptyIndex = TILE_COUNT - 1;
let isShuffling = false;

const state = Array.from({ length: TILE_COUNT }, (_, i) => i);
const tiles = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTileSize() {
  return { width: board.clientWidth / COLS, height: board.clientHeight / ROWS };
}

function indexToPosition(index) {
  return { x: index % COLS, y: Math.floor(index / COLS) };
}

function createTiles() {
  const { width, height } = getTileSize();

  for (let i = 0; i < TILE_COUNT - 1; i++) {
    const tile = document.createElement("div");

    tile.className = "tile";

    // Remove this line if you don't want numbers
    tile.textContent = i + 1;

    tile.style.position = "absolute";
    tile.style.width = `${width}px`;
    tile.style.height = `${height}px`;

    const correctPos = indexToPosition(i);

    tile.style.backgroundImage = "url('./map.jpg')";
    tile.style.backgroundRepeat = "no-repeat";
    tile.style.backgroundSize = `${width * COLS}px ${height * ROWS}px`;

    tile.style.backgroundPosition = `-${correctPos.x * width}px -${correctPos.y * height}px`;

    tile.addEventListener("click", () => {
      if (isShuffling) return;

      const currentIndex = state.indexOf(i);
      moveTile(currentIndex);
    });

    board.appendChild(tile);
    tiles.push(tile);
  }

  render(false);
}

function render(animated = true) {
  const { width, height } = getTileSize();

  for (let tileId = 0; tileId < TILE_COUNT - 1; tileId++) {
    const boardIndex = state.indexOf(tileId);

    const { x, y } = indexToPosition(boardIndex);

    const tile = tiles[tileId];

    tile.style.width = `${width}px`;
    tile.style.height = `${height}px`;

    const correctPos = indexToPosition(tileId);

    tile.style.backgroundSize = `${width * COLS}px ${height * ROWS}px`;

    tile.style.backgroundPosition = `-${correctPos.x * width}px -${correctPos.y * height}px`;

    if (animated) {
      animate(tile, {
        left: `${x * width}px`,
        top: `${y * height}px`,
        duration: 120,
        ease: "outQuad",
      });
    } else {
      tile.style.left = `${x * width}px`;
      tile.style.top = `${y * height}px`;
    }
  }
}

function moveTile(tileIndex) {
  const tileRow = Math.floor(tileIndex / COLS);
  const tileCol = tileIndex % COLS;

  const emptyRow = Math.floor(emptyIndex / COLS);
  const emptyCol = emptyIndex % COLS;

  if (tileRow !== emptyRow && tileCol !== emptyCol) {
    return;
  }

  if (tileRow === emptyRow) {
    if (tileIndex < emptyIndex) {
      for (let i = emptyIndex; i > tileIndex; i--) {
        state[i] = state[i - 1];
      }
    } else {
      for (let i = emptyIndex; i < tileIndex; i++) {
        state[i] = state[i + 1];
      }
    }

    state[tileIndex] = TILE_COUNT - 1;
    emptyIndex = tileIndex;
  } else {
    if (tileIndex < emptyIndex) {
      for (let i = emptyIndex; i > tileIndex; i -= COLS) {
        state[i] = state[i - COLS];
      }
    } else {
      for (let i = emptyIndex; i < tileIndex; i += COLS) {
        state[i] = state[i + COLS];
      }
    }

    state[tileIndex] = TILE_COUNT - 1;
    emptyIndex = tileIndex;
  }

  moves++;
  movesEl.textContent = moves;

  render(true);

  if (isSolved()) {
    setTimeout(() => {
      alert(`Solved in ${moves} moves!`);
    }, 150);
  }
}

function isSolved() {
  for (let i = 0; i < TILE_COUNT; i++) {
    if (state[i] !== i) return false;
  }

  return true;
}

async function animateShuffle(steps = 150) {
  isShuffling = true;

  for (let i = 0; i < steps; i++) {
    const neighbors = [];

    const x = emptyIndex % COLS;
    const y = Math.floor(emptyIndex / COLS);

    if (x > 0) neighbors.push(emptyIndex - 1);
    if (x < COLS - 1) neighbors.push(emptyIndex + 1);
    if (y > 0) neighbors.push(emptyIndex - COLS);
    if (y < ROWS - 1) neighbors.push(emptyIndex + COLS);

    const move = neighbors[Math.floor(Math.random() * neighbors.length)];

    [state[move], state[emptyIndex]] = [state[emptyIndex], state[move]];

    emptyIndex = move;

    render(true);

    await sleep(20);
  }

  moves = 0;
  movesEl.textContent = "0";

  isShuffling = false;
}

async function startNewGame() {
  state.length = 0;

  for (let i = 0; i < TILE_COUNT; i++) {
    state.push(i);
  }

  emptyIndex = TILE_COUNT - 1;

  render(false);

  await sleep(1000);

  await animateShuffle();
}

window.addEventListener("resize", () => {
  render(false);
});

newGameBtn.addEventListener("click", () => {
  startNewGame();
});

createTiles();
startNewGame();

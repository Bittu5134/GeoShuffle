import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import earthData from "../earth.json";
import { updateLocationPanel } from "./timer.js";

gsap.registerPlugin(Flip);

export const COLS = 6;
export const ROWS = 4;

let tiles = [...Array(24).keys()].map((i) => i + 1);
const tilesEnd = [...tiles];

let currentMap = earthData[Math.floor(Math.random() * earthData.length)];
let moveCount = 0;
let numberAssist = true;
let gridOpacity = 1;
let gameActive = false;

export function getTiles() { return tiles; }
export function setTiles(arr) { tiles = [...arr]; }

export function getTilesEnd() { return tilesEnd; }

export function getCurrentMap() { return currentMap; }
export function setCurrentMap(map) { currentMap = map; }

export function getMoveCount() { return moveCount; }
export function setMoveCount(val) {
  moveCount = val;
  const movesEl = document.getElementById("stat-moves");
  if (movesEl) movesEl.textContent = val;
}

export function getNumberAssist() { return numberAssist; }
export function setNumberAssist(val) { numberAssist = val; }

export function getGameActive() { return gameActive; }
export function setGameActive(val) { gameActive = val; }

export function indexToPos(index) {
  return [index % COLS, Math.floor(index / COLS)];
}

export function renderBoard(isGameWon = false) {
  const board = document.getElementById("board");
  if (!board) return;
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className = "boardTileIndex aspect-square flex items-center justify-center select-none cursor-pointer";
    tile.style.backgroundImage = `url('${currentMap.image}')`;
    tile.dataset.flipId = `tile-${value}`;

    const [origCol, origRow] = indexToPos(value - 1);
    tile.style.backgroundPosition = `${origCol * 20}% ${origRow * 33.3333}%`;

    const currentGridOpacity = numberAssist ? gridOpacity : 0;
    tile.style.outline = `1px solid rgba(23, 58, 49, ${currentGridOpacity})`;

    if (value === 24) {
      tile.classList.add("empty-tile");
      if (!isGameWon) {
        tile.classList.add("opacity-0", "pointer-events-none");
      }
    } else {
      if (!isGameWon && numberAssist) {
        tile.innerHTML = `<span class="tile-number">${value}</span>`;
      }
    }

    tile.addEventListener("click", () => handleTileClick(index));
    board.appendChild(tile);
  });
}

export function shuffleBoard(count = 200, onShuffleComplete = null) {
  const board = document.getElementById("board");
  if (!board) return;
  
  board.classList.remove("win-state");
  setMoveCount(0);

  tiles = [...tilesEnd];
  renderBoard(false);

  const state = Flip.getState("#board > div");
  currentMap = earthData[Math.floor(Math.random() * earthData.length)];
  updateLocationPanel(currentMap, false);

  // Perform random sliding actions to shuffle
  let lastMovedIdx = -1;
  for (let i = 0; i < count; i++) {
    const emptyIndex = tiles.indexOf(24);
    const [emptyCol, emptyRow] = indexToPos(emptyIndex);

    const neighbors = [];
    if (emptyCol > 0) neighbors.push(emptyIndex - 1);
    if (emptyCol < COLS - 1) neighbors.push(emptyIndex + 1);
    if (emptyRow > 0) neighbors.push(emptyIndex - COLS);
    if (emptyRow < ROWS - 1) neighbors.push(emptyIndex + COLS);

    const validMoves = neighbors.filter((idx) => idx !== lastMovedIdx);
    const nextIdx = validMoves.length > 0
      ? validMoves[Math.floor(Math.random() * validMoves.length)]
      : neighbors[Math.floor(Math.random() * neighbors.length)];

    tiles[emptyIndex] = tiles[nextIdx];
    tiles[nextIdx] = 24;
    lastMovedIdx = emptyIndex;
  }

  renderBoard(false);

  Flip.from(state, {
    delay: 0.5,
    duration: 1,
    ease: "power4.inOut",
    targets: "#board > div",
    overwrite: "auto",
    onComplete: () => {
      gameActive = true;
      if (onShuffleComplete) onShuffleComplete();
    },
  });
}

// Binds external triggers for move tick callback and victory callback
let onTimerStartCallback = null;
let onVictoryCallback = null;

export function registerCallbacks(onTimerStart, onVictory) {
  onTimerStartCallback = onTimerStart;
  onVictoryCallback = onVictory;
}

function handleTileClick(index) {
  if (!gameActive) return;

  const emptyIndex = tiles.indexOf(24);
  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  if ((tileCol === emptyCol) === (tileRow === emptyRow)) return;

  if (onTimerStartCallback) {
    onTimerStartCallback();
  }

  const state = Flip.getState("#board > div");

  let step;
  if (tileRow === emptyRow) {
    step = tileCol < emptyCol ? 1 : -1;
  } else {
    step = tileRow < emptyRow ? COLS : -COLS;
  }

  let curr = emptyIndex;
  while (curr !== index) {
    const next = curr - step;
    tiles[curr] = tiles[next];
    curr = next;
  }
  tiles[index] = 24;

  setMoveCount(moveCount + 1);
  renderBoard(false);

  Flip.from(state, {
    duration: 0.35,
    ease: "power3.out",
    targets: "#board > div:not(.opacity-0)",
    overwrite: "auto",
  });

  const isVictory = tiles.every((val, i) => val === tilesEnd[i]);
  if (isVictory) {
    gameActive = false;
    if (onVictoryCallback) {
      onVictoryCallback();
    }
  }
}

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;

let tiles = [...Array(24).keys()].map((i) => i + 1);

function indexToPos(index) {
  return [index % COLS, Math.floor(index / COLS)];
}
function posToIndex(col, row) {
  // unused but keeping for asthetic purposes
  return row * COLS + col;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function renderBoard() {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className =
      "aspect-square flex items-center justify-center outline-1 text-amber-50/100 bg-neutral-500 cursor-pointer select-none";
    if (value === 24) {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      const [origCol, origRow] = indexToPos(value - 1);
      tile.textContent = `${value}`;
      // tile.textContent = `${value} - ${origRow}:${origCol}`;
      tile.dataset.flipId = `tile-${value}`;
      tile.style.backgroundPosition = `${origCol * 20}% ${origRow * 33.3333}%`;
    }
    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function moveTile(index) {
  const emptyIndex = tiles.indexOf(24);
  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  if ((tileCol === emptyCol) === (tileRow === emptyRow)) return;
  const state = Flip.getState("#board > div");

  // You'll never know how many hours I spent simplifying it.

  let step;

  // Confusing naming scheme, will change later ig... (its already a lot better than the previous mess)
  if (tileRow === emptyRow) {
    if (tileCol < emptyCol) step = 1;
    else step = -1;
  } else {
    if (tileRow < emptyRow) step = COLS;
    else step = -COLS;
  }

  let curr = emptyIndex;
  while (curr !== index) {
    const next = curr - step;
    tiles[curr] = tiles[next];
    curr = next;
  }

  tiles[index] = 24;
  renderBoard();
  Flip.from(state, {
    duration: 0.35,
    ease: "power3.out",
    targets: "#board > div:not(.opacity-0)",
    overwrite: "auto",
  });
}

function shuffleBoard(count = 200) {
  const state = Flip.getState("#board > div");
  for (let shuffleMove = 0; shuffleMove <= count; shuffleMove++) {
    console.log("shuffle triggered");
    let emptyIndex = tiles.indexOf(24);
    let options = [1, -1, COLS, -COLS];
    let step = options[Math.floor(Math.random() * options.length)];
    let swapIndex = emptyIndex + step;
    let swapPos = indexToPos(swapIndex);
    let emptyPos = indexToPos(emptyIndex);

    if (swapIndex >= tiles.length || swapIndex < 0) {
      shuffleMove--
      continue;
    }

    if (Math.abs(step) === 1 && swapPos[1] !== emptyPos[1]) {
      shuffleMove--;
      continue
    }

    [tiles[emptyIndex], tiles[swapIndex]] = [tiles[swapIndex], tiles[emptyIndex]];

    console.log(swapPos[1] * COLS);
    console.log(swapPos[1] * COLS + COLS);
    console.log(emptyIndex, swapIndex, step);
  }
  renderBoard();
  Flip.from(state, {
    duration: 2,
    ease: "power3.out",
    targets: "#board > div:not(.opacity-0)",
    overwrite: "auto",
  });
}

renderBoard();

document.getElementById("new-game").addEventListener("click", () => shuffleBoard(500));

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;

let boardState = [...Array(24).keys()].map((i) => i + 1);

function indexToPos(index) {
  return [index % COLS, Math.floor(index / COLS)];
}
function posToIndex(col, row) {
  // unused but keeping for asthetic purposes
  return row * COLS + col;
}

function renderBoard() {
  board.innerHTML = "";

  boardState.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className =
      "aspect-square flex items-center justify-center outline-1 text-amber-50/0 bg-neutral-500 cursor-pointer select-none";
    if (value === 24) {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      const [origCol, origRow] = indexToPos(value - 1);
      tile.textContent = `${value} - ${origRow}:${origCol}`;
      tile.dataset.flipId = `tile-${value}`;
      tile.style.backgroundPosition = `${origCol * 20}% ${origRow * 33.3333}%`;
    }
    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function moveTile(index) {
  const emptyIndex = boardState.indexOf(24);
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
    boardState[curr] = boardState[next];
    curr = next;
  }

  boardState[index] = 24;
  renderBoard();
  Flip.from(state, {
    duration: 0.35,
    ease: "power3.out",
    targets: "#board > div:not(.opacity-0)",
    overwrite: "auto",
  });
}

renderBoard();

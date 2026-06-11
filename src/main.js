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
  return row * COLS + col;
}

function renderBoard() {
  board.innerHTML = "";
  
  tiles.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className =
      "aspect-square flex items-center justify-center outline-1 text-amber-50/0 bg-neutral-500 cursor-pointer select-none";
    if (value === 24) {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      tile.textContent = value;
      tile.dataset.flipId = `tile-${value}`;
      const [origCol, origRow] = indexToPos(value - 1);
      tile.style.backgroundPosition = `${origCol * 20}% ${origRow * 33.3333}%`;
    }
    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function moveTile(index) {

  const state = Flip.getState("#board > div");

  const emptyIndex = tiles.indexOf(24);
  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  
  // check if the tile is adjacent (excluding diagonally)
  if (Math.abs(tileCol - emptyCol) + Math.abs(tileRow - emptyRow) === 1) {
    
    tiles[emptyIndex] = tiles[index];
    tiles[index] = 24;
    renderBoard();
    
    Flip.from(state, {
      duration: 0.4,
      ease: "power2.out",
      targets: "#board > div:not(.opacity-0)",
    });
  }
} 

renderBoard();

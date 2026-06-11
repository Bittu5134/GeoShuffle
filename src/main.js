const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;

// 1 to 23 are the tile values, "" is our empty placeholder tile
let tiles = [...Array(23).keys()].map((i) => i + 1).concat("");

function indexToPos(index) {
  const column = index % COLS;
  const row = Math.floor(index / COLS);
  return [column, row];
}

function renderBoard() {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    const tile = document.createElement("div");

    tile.className =
      "aspect-square flex items-center justify-center outline-1 text-amber-50 bg-neutral-500 cursor-pointer select-none transition-all duration-200";

    if (value === "") {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      tile.textContent = value;

      // Assign a unique view-transition-name matching the tile's permanent number value.
      // This maps its old screen position directly to its new screen position.
      tile.style.viewTransitionName = `tile-${value}`;

      const [origCol, origRow] = indexToPos(value - 1);
      const colPercent = origCol * 20;
      const rowPercent = origRow * 33.3333;
      tile.style.backgroundPosition = `${colPercent}% ${rowPercent}%`;
    }

    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function moveTile(index) {
  const emptyIndex = tiles.indexOf("");

  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  const isAdjacent = Math.abs(tileCol - emptyCol) + Math.abs(tileRow - emptyRow) === 1;

  if (isAdjacent) {
    // Perform state array swap
    tiles[emptyIndex] = tiles[index];
    tiles[index] = "";

    // Check if browser supports the View Transitions API
    if (document.startViewTransition) {
      // Morph the structural board change smoothly
      document.startViewTransition(() => {
        renderBoard();
      });
    } else {
      // Fallback for older browsers
      renderBoard();
    }
  }
}

// Kick off initial compilation render track
renderBoard();

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

    // Core Tailwind structure classes matching your layout requirements
    tile.className =
      "aspect-square flex items-center justify-center outline-1 text-amber-50 bg-neutral-500 cursor-pointer select-none transition-all duration-200";

    if (value === "") {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      tile.textContent = value;

      // Calculate background slicing math dynamically based on the tile's permanent value identity
      const [origCol, origRow] = indexToPos(value - 1);
      const colPercent = origCol * 20; // 100% / (6 columns - 1) = 20% steps
      const rowPercent = origRow * 33.3333; // 100% / (4 rows - 1) = 33.3333% steps
      tile.style.backgroundPosition = `${colPercent}% ${rowPercent}%`;
    }

    // Capture user clicks to calculate step translation moves
    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function moveTile(index) {
  const emptyIndex = tiles.indexOf("");

  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  // Math check: A move is valid if the clicked tile is exactly 1 step away
  // from the ghost slot horizontally or vertically (Manhattan Distance)
  const isAdjacent = Math.abs(tileCol - emptyCol) + Math.abs(tileRow - emptyRow) === 1;

  if (isAdjacent) {
    // Perform state array swap
    tiles[emptyIndex] = tiles[index];
    tiles[index] = "";

    // Instantly refresh DOM node map tracking positions cleanly
    renderBoard();
  }
}

// Kick off initial compilation render track
renderBoard();

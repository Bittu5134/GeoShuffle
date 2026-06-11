const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;

// 1 to 23 are the visible tile values, 24 is our empty placeholder tile at index 23
let tiles = [...Array(24).keys()].map((i) => i + 1);

function shuffleSlidingPuzzle(inputArray) {
  // 1. Create a shallow copy so we don't mutate the original input array
  let board = [...inputArray];

  // Grid dimensions: 6 columns, 4 rows
  const cols = 6;
  const rows = 4;

  // 2. Find the empty space (24)
  let emptyIndex = board.indexOf(24);

  if (emptyIndex === -1) {
    throw new Error("Could not find the empty space (24) in the input array.");
  }

  // 3. Simulate random legal moves to guarantee solvability
  const shuffleMoves = 600;

  for (let i = 0; i < shuffleMoves; i++) {
    // Calculate current 2D (row, col) position in the 6x4 grid
    const currRow = Math.floor(emptyIndex / cols);
    const currCol = emptyIndex % cols;

    let validMoves = [];

    // Check boundary rules for a 6-column, 4-row setup
    if (currRow > 0) validMoves.push(emptyIndex - cols); // Move UP
    if (currRow < rows - 1) validMoves.push(emptyIndex + cols); // Move DOWN
    if (currCol > 0) validMoves.push(emptyIndex - 1); // Move LEFT
    if (currCol < cols - 1) validMoves.push(emptyIndex + 1); // Move RIGHT

    // Pick a random valid direction
    const randomMoveIndex = validMoves[Math.floor(Math.random() * validMoves.length)];

    // Swap the empty space with the chosen adjacent tile
    board[emptyIndex] = board[randomMoveIndex];
    board[randomMoveIndex] = 24; // set new empty space

    // Update tracking index
    emptyIndex = randomMoveIndex;
  }

  return board;
}

// Scramble the tiles array safely
tiles = shuffleSlidingPuzzle(tiles);

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

    // Value 24 is treated as the empty tile space
    if (value === 24) {
      tile.classList.add("opacity-0", "pointer-events-none");
    } else {
      tile.textContent = value;

      // Assign a unique view-transition-name matching the tile's permanent number value.
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
  const emptyIndex = tiles.indexOf(24);

  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  const isAdjacent = Math.abs(tileCol - emptyCol) + Math.abs(tileRow - emptyRow) === 1;

  if (isAdjacent) {
    // Perform state array swap
    tiles[emptyIndex] = tiles[index];
    tiles[index] = 24;

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

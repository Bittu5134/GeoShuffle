const board = document.getElementById("board");
const tiles = [];

function indexToPos(index) {
  const column = index % 6;
  const row = Math.floor(index / 6);

  return [column, row];
}

for (let index = 0; index < 24; index++) {
  const tile = document.createElement("div");

  const [col, row] = indexToPos(index);

  tile.textContent = `${index + 1} - ${col}:${row}`;

  tile.className =
    "aspect-square flex items-center justify-center outline-1 text-amber-50 bg-neutral-500";
  tile.id = `tile${index}`;
  tile.dataset.index = index
  tile.style.backgroundPosition = `${col * 20}% ${row * 33.3333}%`;

  tiles.push(tile);
}

board.append(...tiles);

function handleTileClick(event) {
 
  const tile = event.target.closest("#board > div");

  if (!tile) return;

  const currentPosition = parseInt(tile.dataset.index);
  const tileText = tile.textContent;

  if (currentPosition === 23) {
    console.log("Clicked the empty slot!");
    return;
  }

  console.log(`Tile ${tileText} clicked at board index: ${currentPosition}`);


}

board.addEventListener("click", handleTileClick);
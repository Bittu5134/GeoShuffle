const board = document.getElementById("board");
const boardStyle = window.getComputedStyle(board);

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

  let clientHeight =
    board.clientHeight - parseFloat(boardStyle.paddingTop) - parseFloat(boardStyle.paddingBottom);
  let clientWidth =
    board.clientWidth - parseFloat(boardStyle.paddingRight) - parseFloat(boardStyle.paddingLeft);

  let randomSign = Math.random() < 0.5 ? -1 : 1;
  clientHeight *= randomSign;
  randomSign = Math.random() < 0.5 ? -1 : 1;
  clientHeight *= randomSign;

  tile.style.transform += `translate(${clientWidth/6}px, ${clientHeight/4}px)`;


}

board.addEventListener("click", handleTileClick);
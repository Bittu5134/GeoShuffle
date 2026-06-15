import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import earthData from "./earth.json";

gsap.registerPlugin(Flip);

const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;
let isVictory = false;

let tiles = [...Array(24).keys()].map((i) => i + 1);
const tilesEnd = [...tiles];
let currentMap = {
  country: "China",
  image: "./map.jpg",
  map: "https://www.google.com/maps/@29.14274,90.513512,15z/data=!3m1!1e3",
  region: "Shannan",
};

function indexToPos(index) {
  return [index % COLS, Math.floor(index / COLS)];
}
function posToIndex(col, row) {
  // unused but keeping for asthetic purposes
  return row * COLS + col;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Clean up renderBoard so the text target wrapper always exists
// 1. Update renderBoard so tile 24 is ready to be revealed smoothly
function renderBoard(isGameWon = false) {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className =
      "boardTileIndex aspect-square flex items-center justify-center text-2xl font-black select-none cursor-pointer";

    // Set up the map imagery for ALL tiles right away
    tile.style.backgroundImage = `url('${currentMap["image"]}')`;
    tile.dataset.flipId = `tile-${value}`;
    const [origCol, origRow] = indexToPos(value - 1);
    tile.style.backgroundPosition = `${origCol * 20}% ${origRow * 33.3333}%`;

    if (value === 24) {
      // Add a unique identifier class so GSAP can target the hidden tile later
      tile.classList.add("empty-tile"); 
      
      if (!isGameWon) {
        tile.classList.add("opacity-0", "pointer-events-none");
      }
    } else {
      // If the game isn't won yet, keep the text span active
      if (!isGameWon) {
        tile.innerHTML = `<span class="tile-number">${value}</span>`;
      }
    }

    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

// 2. Synchronize the fade-out of numbers with the fade-in of tile 24
function victory() {
  // Lock the board so the user can't click things mid-celebration animation
  board.classList.add("pointer-events-none");

  // Create a master GSAP timeline to coordinate the effects perfectly
  const tl = gsap.timeline({
    onComplete: () => {
      // Once all fades complete, lock in the official permanent win state structural render
      renderBoard(true);
      board.classList.add("win-state");
      board.classList.remove("pointer-events-none");
    }
  });

  // Fade the numbers out
  tl.to(".tile-number", {
    opacity: 0,
    scale: 0.5,
    duration: 0.5,
    ease: "power2.in",
    stagger: 0.01,
  }, 0); // The '0' means start right away

  // Smoothly fade tile 24's missing map slice IN at the exact same time!
  tl.to(".empty-tile", {
    opacity: 1,
    duration: 0.5,
    ease: "power2.out"
  }, 0); 
}
// 2. Clear out the duplicate layout definitions inside moveTile
function moveTile(index) {
  const emptyIndex = tiles.indexOf(24);
  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  if ((tileCol === emptyCol) === (tileRow === emptyRow)) return;
  const state = Flip.getState("#board > div");

  let step;
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

  renderBoard(false);
  Flip.from(state, {
    duration: 0.35,
    ease: "power3.out",
    targets: "#board > div:not(.opacity-0)",
    overwrite: "auto",
  });
  const isVictory = tiles.every((val, i) => val === tilesEnd[i]);
  if (isVictory) {
    victory();
  }
}

function shuffleBoard(count = 200) {
  tiles = [...tilesEnd];
  renderBoard();
  const state = Flip.getState("#board > div");
  currentMap = earthData[Math.floor(Math.random() * earthData.length)];
  for (let shuffleMove = 0; shuffleMove <= count; shuffleMove++) {
    console.log("shuffle triggered");
    let emptyIndex = tiles.indexOf(24);
    let options = [1, -1, COLS, -COLS];
    let step = options[Math.floor(Math.random() * options.length)];
    let swapIndex = emptyIndex + step;
    let swapPos = indexToPos(swapIndex);
    let emptyPos = indexToPos(emptyIndex);

    if (swapIndex >= tiles.length || swapIndex < 0) {
      shuffleMove--;
      continue;
    }

    if (Math.abs(step) === 1 && swapPos[1] !== emptyPos[1]) {
      shuffleMove--;
      continue;
    }

    [tiles[emptyIndex], tiles[swapIndex]] = [tiles[swapIndex], tiles[emptyIndex]];

    console.log(swapPos[1] * COLS);
    console.log(swapPos[1] * COLS + COLS);
    console.log(emptyIndex, swapIndex, step);
  }
  renderBoard();
  Flip.from(state, {
    delay: 1.5,
    duration: 1,
    ease: "power4.inOut",
    targets: "#board > div",
    overwrite: "auto",
    stagger: 0.1,
  });
}

shuffleBoard();

document.getElementById("new-game").addEventListener("click", () => shuffleBoard());

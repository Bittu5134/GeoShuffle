import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import earthData from "./earth.json";

gsap.registerPlugin(Flip);

const board = document.getElementById("board");
const COLS = 6;
const ROWS = 4;

let tiles = [...Array(24).keys()].map((i) => i + 1);
const tilesEnd = [...tiles];
let currentMap = {
  country: "China",
  image: "./map.jpg",
  map: "https://www.google.com/maps/@29.14274,90.513512,15z/data=!3m1!1e3",
  region: "Shannan",
};

let moveCount = 0;
let timeElapsed = 0;
let timerInterval = null;
let gameActive = false;

let numberAssist = true;
let gridOpacity = 1;

const SUPABASE_URL = "https://rmkplarqcrktdjpkegyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_uRHRP8GLVvPE1WCJ1UoWkw_Cwqm_Vn6";
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

let playerName = localStorage.getItem("geoPlayerName") || "Anonymous";
const nameInput = document.getElementById("setting-name");
if (nameInput) {
  nameInput.value = playerName;
  nameInput.addEventListener("input", (e) => {
    playerName = e.target.value.trim() || "Anonymous";
    localStorage.setItem("geoPlayerName", playerName);
  });
}

function indexToPos(index) {
  return [index % COLS, Math.floor(index / COLS)];
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed++;
    document.getElementById("stat-time").textContent = formatTime(timeElapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

async function fetchGlobalLeaderboard(tab = "time") {
  const column = tab === "time" ? "time_spent" : "moves_made";
  const url = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name,time_spent,moves_made&order=${column}.asc&limit=10`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch global leaderboard:", err);
    return [];
  }
}

async function submitScore(name, time, moves) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        player_name: name,
        time_spent: time,
        moves_made: moves
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(`Failed to submit score: ${JSON.stringify(errData)}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function renderLeaderboards(globalTab = "time", localTab = "time") {
  const globalBody = document.querySelector("#global-table tbody");
  globalBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center opacity-50 italic">Loading scores...</td></tr>`;

  const globalData = await fetchGlobalLeaderboard(globalTab);

  globalBody.innerHTML = "";
  if (globalData.length === 0) {
    globalBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center opacity-50 italic">No global scores yet!</td></tr>`;
  } else {
    globalData.forEach((player, i) => {
      const row = document.createElement("tr");
      row.className = "border-b border-main-text/5 hover:bg-main-text/5";
      row.innerHTML = `
        <td class="py-2 font-black text-amber-600">#${i + 1}</td>
        <td>${player.player_name}</td>
        <td class="${globalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(player.time_spent)}</td>
        <td class="${globalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${player.moves_made}</td>
      `;
      globalBody.appendChild(row);
    });
  }

  const localBody = document.querySelector("#local-table tbody");
  localBody.innerHTML = "";
  const localHistory = JSON.parse(localStorage.getItem("geoHistory")) || [];

  if (localHistory.length === 0) {
    localBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center opacity-50 italic">No finishes yet! Log a run to begin.</td></tr>`;
    return;
  }

  const sortedLocal = [...localHistory]
    .sort((a, b) => {
      if (localTab === "time") return a.time - b.time || a.moves - b.moves;
      return a.moves - b.moves || a.time - b.time;
    })
    .slice(0, 5);

  sortedLocal.forEach((run, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-main-text/5 hover:bg-main-text/5";
    row.innerHTML = `
      <td class="py-2 font-black">#${i + 1}</td>
      <td>${run.date}</td>
      <td class="${localTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(run.time)}</td>
      <td class="${localTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${run.moves}</td>
    `;
    localBody.appendChild(row);
  });
}

function renderBoard(isGameWon = false) {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    const tile = document.createElement("div");
    tile.className =
      "boardTileIndex aspect-square flex items-center justify-center select-none cursor-pointer";

    tile.style.backgroundImage = `url('${currentMap["image"]}')`;
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

    tile.addEventListener("click", () => moveTile(index));
    board.appendChild(tile);
  });
}

function updateGridOpacityOnly() {
  const allTiles = board.querySelectorAll("div");
  allTiles.forEach((tile) => {
    tile.style.outline = `1px solid rgba(23, 58, 49, ${gridOpacity})`;
  });
}

function moveTile(index) {
  if (!gameActive) return;

  const emptyIndex = tiles.indexOf(24);
  const [tileCol, tileRow] = indexToPos(index);
  const [emptyCol, emptyRow] = indexToPos(emptyIndex);

  if ((tileCol === emptyCol) === (tileRow === emptyRow)) return;
  if (moveCount === 0 && timeElapsed === 0) startTimer();

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

  moveCount++;
  document.getElementById("stat-moves").textContent = moveCount;

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

async function victory() {
  gameActive = false;
  stopTimer();
  board.classList.add("pointer-events-none");

  const localHistory = JSON.parse(localStorage.getItem("geoHistory")) || [];
  const currentRun = {
    date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: timeElapsed,
    moves: moveCount,
  };
  localHistory.push(currentRun);
  localStorage.setItem("geoHistory", JSON.stringify(localHistory));

  // Submit to Supabase
  await submitScore(playerName, timeElapsed, moveCount);
  renderLeaderboards(activeGlobalTab, activeLocalTab);

  const tl = gsap.timeline({
    onComplete: () => {
      renderBoard(true);
      board.classList.add("win-state");
      board.classList.remove("pointer-events-none");
    },
  });

  tl.to(
    ".tile-number",
    { opacity: 0, scale: 0.5, duration: 0.5, ease: "power2.in", stagger: 0.01 },
    0,
  );
  tl.to(".empty-tile", { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
}

function shuffleBoard(count = 200) {
  stopTimer();
  board.classList.remove("win-state");
  moveCount = 0;
  timeElapsed = 0;
  document.getElementById("stat-moves").textContent = "0";
  document.getElementById("stat-time").textContent = "00:00";

  tiles = [...tilesEnd];
  renderBoard();

  const state = Flip.getState("#board > div");
  currentMap = earthData[Math.floor(Math.random() * earthData.length)];

  for (let shuffleMove = 0; shuffleMove <= count; shuffleMove++) {
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
  }

  renderBoard();

  Flip.from(state, {
    delay: 0.5,
    duration: 1,
    ease: "power4.inOut",
    targets: "#board > div",
    overwrite: "auto",
    onComplete: () => {
      gameActive = true;
    },
  });
}

// FIX: Numbers toggle no longer overrides grid settings
document.getElementById("setting-numbers").addEventListener("change", (e) => {
  numberAssist = e.target.checked;
  renderBoard();
});


// FIX: Themes now shift DOM attributes correctly
document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const parent = e.target.closest(".join");
    parent.querySelectorAll("button").forEach((b) => {
      b.classList.add("btn-ghost");
      b.classList.remove("bg-main-text", "text-main-bg");
    });
    e.target.classList.remove("btn-ghost");
    e.target.classList.add("bg-main-text", "text-main-bg");

    let targetTheme = e.target.dataset.themeBtn;
    if (targetTheme === "auto") {
      targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", targetTheme);
  });
});

function setupTabToggle(containerId, callback) {
  const container = document.getElementById(containerId);
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      container.querySelectorAll("button").forEach((b) => {
        b.classList.add("btn-ghost");
        b.classList.remove("bg-main-text", "text-main-bg");
      });
      e.target.classList.remove("btn-ghost");
      e.target.classList.add("bg-main-text", "text-main-bg");
      callback(e.target.dataset.type);
    });
  });
}

let activeGlobalTab = "time";
let activeLocalTab = "time";

setupTabToggle("global-tabs", (type) => {
  activeGlobalTab = type;
  renderLeaderboards(activeGlobalTab, activeLocalTab);
});
setupTabToggle("local-tabs", (type) => {
  activeLocalTab = type;
  renderLeaderboards(activeGlobalTab, activeLocalTab);
});

gameActive = false;
shuffleBoard()
renderLeaderboards();

document.getElementById("new-game").addEventListener("click", () => shuffleBoard(150));


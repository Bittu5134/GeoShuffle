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
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

let playerName = localStorage.getItem("geoPlayerName") || "Anonymous";

if (!localStorage.getItem("geoPlayerName")) {
  const defaultNames = [
    "GeoWiz",
    "MapLover",
    "GlobeTrotter",
    "AtlasExplorer",
    "TerraSearcher",
    "GridSlider",
    "CompassClimber",
    "GeoQuest",
    "CartoCrafter",
    "LatitudeLeaper",
    "VectorVoyager",
    "TopoTracker",
    "MeridianMind",
    "OrbitFinder",
    "AzimuthAce",
    "WaypointWanderer",
    "BorderBounder",
    "PixelPathfinder",
    "LandmarkHunter",
    "ScaleSeeker",
    "DatumDrifter",
    "GisGuru",
    "LegendReader",
    "TerrainTamer",
    "EquatorEnthusiast",
    "ZoneZenith",
    "ApexAtlas",
    "ChartChaser",
    "SpheroidScout",
    "PlotMaster",
    "ContoursCruiser",
    "GeoGenius",
    "MapMatrix",
    "VistaVoyage",
    "GlobeGlider",
    "HorizonHiker",
    "CoordCommander",
    "TerraTechie",
  ];
  const randomNum = Math.floor(100 + Math.random() * 900);
  const randomPlaceholder = `${defaultNames[Math.floor(Math.random() * defaultNames.length)]}${randomNum}`;

  playerName = randomPlaceholder;

  const modal = document.getElementById("name_prompt_modal");
  const input = document.getElementById("prompt-name-input");
  const saveBtn = document.getElementById("btn-save-name");

  if (modal && input && saveBtn) {
    input.value = randomPlaceholder;
    modal.showModal();

    saveBtn.addEventListener("click", () => {
      playerName = (input.value.trim() || randomPlaceholder).substring(0, 15);
      localStorage.setItem("geoPlayerName", playerName);
      if (nameInput) nameInput.value = playerName;
      modal.close();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveBtn.click();
      }
    });
  }
}

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

    // Update hint button timer countdown if game is running and unsolved
    if (gameActive) {
      updateLocationPanel(false);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateLocationPanel(showFullDetails = false) {
  const detailsEl = document.getElementById("location-details");
  const linkEl = document.getElementById("location-link");
  if (!detailsEl || !linkEl) return;

  if (showFullDetails) {
    const locationName = [currentMap.region, currentMap.country].filter(Boolean).join(", ");
    detailsEl.textContent = locationName || "Unknown Location";
    linkEl.href = currentMap.map || "#";
    linkEl.textContent = "🌐 View on Google Maps";
    linkEl.className = "btn btn-success font-bold rounded-xl text-xs sm:text-sm";
    linkEl.style.opacity = "1";
  } else {
    detailsEl.textContent = "Location is hidden!";

    if (timeElapsed >= 60) {
      linkEl.href = currentMap.map || "#";
      linkEl.textContent = "📍 Open in Maps (Hint)";
      linkEl.className = "btn btn-outline border-neutral font-bold rounded-xl text-xs sm:text-sm shadow-md";
      linkEl.style.opacity = "1";
    } else {
      linkEl.href = "#";
      linkEl.textContent = `🔒 Hint in ${60 - timeElapsed}s`;
      linkEl.className = "btn btn-outline border-neutral font-bold rounded-xl text-xs sm:text-sm";
      linkEl.style.opacity = "0.5";
    }
  }
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
      body: JSON.stringify({ player_name: name, time_spent: time, moves_made: moves }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(`Failed to submit score: ${JSON.stringify(errData)}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function renderGlobalLeaderboard() {
  const globalBody = document.querySelector("#global-table tbody");
  if (!globalBody) return;
  globalBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center opacity-50 italic">Loading scores...</td></tr>`;

  const globalData = await fetchGlobalLeaderboard(activeGlobalTab);

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
        <td class="${activeGlobalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(player.time_spent)}</td>
        <td class="${activeGlobalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${player.moves_made}</td>
      `;
      globalBody.appendChild(row);
    });
  }
}

function renderLocalLeaderboard() {
  const localBody = document.querySelector("#local-table tbody");
  if (!localBody) return;
  localBody.innerHTML = "";
  const localHistory = JSON.parse(localStorage.getItem("geoHistory")) || [];

  if (localHistory.length === 0) {
    localBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center opacity-50 italic">No finishes yet! Log a run to begin.</td></tr>`;
    return;
  }

  const sortedLocal = [...localHistory]
    .sort((a, b) => {
      if (activeLocalTab === "time") return a.time - b.time || a.moves - b.moves;
      return a.moves - b.moves || a.time - b.time;
    })
    .slice(0, 5);

  sortedLocal.forEach((run, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-main-text/5 hover:bg-main-text/5";
    row.innerHTML = `
      <td class="py-2 font-black">#${i + 1}</td>
      <td>${run.date}</td>
      <td class="${activeLocalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(run.time)}</td>
      <td class="${activeLocalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${run.moves}</td>
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

async function getScoreRank(timeSpent) {
  const url = `${SUPABASE_URL}/rest/v1/leaderboard?time_spent=lt.${timeSpent}`;
  try {
    const res = await fetch(url, { method: "GET", headers: { ...headers, Prefer: "count=exact" } });
    const countHeader = res.headers.get("content-range");
    if (countHeader && countHeader.includes("/")) {
      const parts = countHeader.split("/");
      const totalBetter = parseInt(parts[1]);
      if (!isNaN(totalBetter)) {
        return `#${totalBetter + 1}`;
      }
    }
    return "--";
  } catch (err) {
    console.error("Failed to fetch score rank:", err);
    return "--";
  }
}

function triggerConfetti() {
  if (typeof confetti !== "function") return;
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, zIndex: 10000 });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, zIndex: 10000 });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function generateScorecard(timeText, movesText, rankText) {
  const previewImg = document.getElementById("scorecard-preview");
  const loadingEl = document.getElementById("scorecard-loading");
  const downloadBtn = document.getElementById("btn-download-scorecard");

  if (!previewImg || !loadingEl) return;

  previewImg.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const baseImg = new Image();
  baseImg.crossOrigin = "anonymous";

  // Use images.weserv.nl proxy for remote gstatic files to bypass CORS canvas tainting
  if (currentMap.image.startsWith("http")) {
    baseImg.src = "https://images.weserv.nl/?url=" + encodeURIComponent(currentMap.image);
  } else {
    baseImg.src = currentMap.image;
  }

  baseImg.onload = () => {
    const w = baseImg.naturalWidth || 800;
    const h = baseImg.naturalHeight || 533;
    canvas.width = w;
    canvas.height = h;

    // Draw background satellite image
    ctx.drawImage(baseImg, 0, 0, w, h);

    const bannerHeight = Math.floor(h * 0.28);

    // Shadow setup
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 6;

    // GeoShuffle logo with brutalist outline (Top Left)
    const logoX = Math.floor(w * 0.04);
    const logoY = Math.floor(h * 0.09);
    ctx.font = `900 ${Math.floor(h * 0.07)}px Fredoka, sans-serif`;

    // Draw thick dark outline stroke first
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.floor(h * 0.015);
    ctx.lineJoin = "round";
    ctx.strokeText("GEOSHUFFLE", logoX, logoY);

    // Draw yellow fill on top
    ctx.fillStyle = "#facc15"; // yellow-400
    ctx.fillText("GEOSHUFFLE", logoX, logoY);

    // Setup common outline styles for body text (makes all text gradient-proof)
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";

    // Location Text (Bottom Left)
    const locationName = [currentMap.region, currentMap.country].filter(Boolean).join(", ");

    // 1. "Solved Location" subtitle
    const solvedLocText = "Solved Location";
    const solvedLocX = Math.floor(w * 0.04);
    const solvedLocY = h - Math.floor(bannerHeight * 0.65);
    ctx.font = `${Math.floor(h * 0.03)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(2, Math.floor(h * 0.007));
    ctx.strokeText(solvedLocText, solvedLocX, solvedLocY);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(solvedLocText, solvedLocX, solvedLocY);

    // 2. Main Location Name
    const locX = Math.floor(w * 0.04);
    const locY = h - Math.floor(bannerHeight * 0.35);
    ctx.font = `900 ${Math.floor(h * 0.05)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(3, Math.floor(h * 0.01));
    ctx.strokeText(locationName || "Unknown Location", locX, locY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(locationName || "Unknown Location", locX, locY);

    // Stats (Bottom Right)
    ctx.textAlign = "right";

    // 3. Stats details
    const statsText = `⏱️ ${timeText}  |  👣 ${movesText} moves  |  🏆 Rank ${rankText}`;
    const statsX = w - Math.floor(w * 0.04);
    const statsY = h - Math.floor(bannerHeight * 0.35);
    ctx.font = `bold ${Math.floor(h * 0.042)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(3, Math.floor(h * 0.009));
    ctx.strokeText(statsText, statsX, statsY);
    ctx.fillStyle = "#34d399"; // emerald-400
    ctx.fillText(statsText, statsX, statsY);

    // 4. Domain URL
    const domainText = "geoshuffle.bittu.dev";
    const domainX = w - Math.floor(w * 0.04);
    const domainY = h - Math.floor(bannerHeight * 0.15);
    ctx.font = `${Math.floor(h * 0.028)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(2, Math.floor(h * 0.006));
    ctx.strokeText(domainText, domainX, domainY);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(domainText, domainX, domainY);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      previewImg.src = dataUrl;
      previewImg.classList.remove("hidden");
      loadingEl.classList.add("hidden");

      if (downloadBtn) {
        downloadBtn.href = dataUrl;
      }
    } catch (e) {
      console.error("Canvas export failed:", e);
      loadingEl.classList.add("hidden");
    }
  };

  baseImg.onerror = () => {
    console.error("Failed to load base image for canvas scorecard.");
    loadingEl.classList.add("hidden");
  };
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function copyToClipboardFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    const btn = document.getElementById("btn-copy-share");
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <span class="text-lg">✅</span>
        <span class="text-[9px] uppercase opacity-75">Copied!</span>
      `;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 2000);
    }
  } catch (err) {
    console.error("execCommand fallback failed:", err);
  }
  document.body.removeChild(textarea);
}

async function victory() {
  gameActive = false;
  stopTimer();
  board.classList.add("pointer-events-none");

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

  // Show full location details
  updateLocationPanel(true);

  // Trigger confetti shower
  triggerConfetti();

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
  renderGlobalLeaderboard();
  renderLocalLeaderboard();

  // Retrieve global rank
  const rank = await getScoreRank(timeElapsed);
  const timeText = formatTime(timeElapsed);
  const movesText = moveCount.toString();

  // Populate Victory Modal UI
  document.getElementById("victory-time").textContent = timeText;
  document.getElementById("victory-moves").textContent = movesText;
  document.getElementById("victory-rank").textContent = rank;

  // Setup Social Sharing
  const locationName = [currentMap.region, currentMap.country].filter(Boolean).join(", ");
  const shareUrl = "https://geoshuffle.bittu.dev";
  const mapLink = currentMap.map || "#";
  const shareText = `I solved the GeoShuffle satellite puzzle for ${locationName} in ${timeText} with ${movesText} moves! Global Rank: ${rank}. Can you beat me?\n\nPlay here: ${shareUrl}\n🗺️ Google Maps Location: ${mapLink}`;

  // Twitter
  document.getElementById("share-twitter").href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  // Reddit (url field has map image, title is short, stats go to text body field)
  const redditTitle = `I solved the GeoShuffle satellite puzzle for ${locationName}!`;
  const redditBody = `⏱️ Time: ${timeText}\n👣 Moves: ${movesText}\n🏆 Global Rank: ${rank}\n\nPlay here: ${shareUrl}\n🗺️ Google Maps Location: ${mapLink}`;
  document.getElementById("share-reddit").href =
    `https://www.reddit.com/submit?title=${encodeURIComponent(redditTitle)}&url=${encodeURIComponent(currentMap.image)}&text=${encodeURIComponent(redditBody)}`;

  // Facebook
  document.getElementById("share-facebook").href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

  // Telegram
  const shareTelegram = document.getElementById("share-telegram");
  if (shareTelegram) {
    const telegramText = `${shareText}\n\nSatellite View: ${currentMap.image}`;
    shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`;
  }

  // Pinterest (add both description and title parameters for text metadata visibility)
  const sharePinterest = document.getElementById("share-pinterest");
  if (sharePinterest) {
    sharePinterest.href = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(currentMap.image)}&description=${encodeURIComponent(shareText)}&title=${encodeURIComponent(redditTitle)}`;
  }

  // Copy Text Button
  const copyShareBtn = document.getElementById("btn-copy-share");
  if (copyShareBtn) {
    const newCopyBtn = copyShareBtn.cloneNode(true);
    copyShareBtn.parentNode.replaceChild(newCopyBtn, copyShareBtn);
    newCopyBtn.addEventListener("click", () => {
      copyToClipboardFallback(shareText);
    });
  }

  // Open Victory Modal
  const victoryModal = document.getElementById("victory_modal");
  if (victoryModal) {
    victoryModal.showModal();
  }

  // Generate Scorecard image
  generateScorecard(timeText, movesText, rank);
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
  updateLocationPanel(false);

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

// Themes persistence
const savedTheme = localStorage.getItem("geoTheme") || "geoshuffle";
document.documentElement.setAttribute("data-theme", savedTheme);

document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
  // Style active button on startup
  const targetTheme = btn.dataset.themeBtn;
  if (targetTheme === savedTheme) {
    const parent = btn.closest(".join");
    if (parent) {
      parent.querySelectorAll("button").forEach((b) => {
        b.classList.add("btn-ghost");
        b.classList.remove("bg-main-text", "text-main-bg");
      });
      btn.classList.remove("btn-ghost");
      btn.classList.add("bg-main-text", "text-main-bg");
    }
  }

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
    localStorage.setItem("geoTheme", targetTheme);
  });
});

function setupTabToggle(containerId, callback) {
  const container = document.getElementById(containerId);
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      container.querySelectorAll("button").forEach((b) => {
        b.classList.add("btn-ghost");
        b.classList.remove("btn-active");
      });
      e.target.classList.remove("btn-ghost");
      e.target.classList.add("btn-active");
      callback(e.target.dataset.type);
    });
  });
}

let activeGlobalTab = "time";
let activeLocalTab = "time";
setupTabToggle("global-tabs", (type) => {
  activeGlobalTab = type;
  renderGlobalLeaderboard();
});
setupTabToggle("local-tabs", (type) => {
  activeLocalTab = type;
  renderLocalLeaderboard();
});

gameActive = false;
shuffleBoard();
renderGlobalLeaderboard();
renderLocalLeaderboard();

document.getElementById("new-game").addEventListener("click", () => shuffleBoard(5));

const locationLink = document.getElementById("location-link");
if (locationLink) {
  locationLink.addEventListener("click", (e) => {
    const href = locationLink.getAttribute("href");
    if (href === "#" || !href) {
      e.preventDefault();
    }
  });
}

const victoryModalElement = document.getElementById("victory_modal");
if (victoryModalElement) {
  victoryModalElement.addEventListener("close", () => {
    shuffleBoard(150);
  });
  // Exit modal when clicking on the backdrop background area
  victoryModalElement.addEventListener("click", (e) => {
    if (e.target === victoryModalElement) {
      victoryModalElement.close();
    }
  });
}
document.getElementById("btn-native-share")?.addEventListener("click", async (e) => {
  e.preventDefault();

  // Re-generate the text payload dynamically based on the current map status when clicked
  const timeText = document.getElementById("victory-time").textContent;
  const movesText = document.getElementById("victory-moves").textContent;
  const rankText = document.getElementById("victory-rank").textContent;
  const locationName = [currentMap.region, currentMap.country].filter(Boolean).join(", ");
  const shareUrl = "https://geoshuffle.bittu.dev";
  const mapLink = currentMap.map || "#";

  const shareText = `I solved the GeoShuffle satellite puzzle for ${locationName} in ${timeText} with ${movesText} moves! Global Rank: ${rankText}. Can you beat me?\n\nPlay here: ${shareUrl}\n🗺️ Google Maps Location: ${mapLink}`;
  const shareTextWithImg = `${shareText}\n\nSatellite View: ${currentMap.image}`;

  const imgEl = document.getElementById("scorecard-preview");
  const dataUrl = imgEl ? imgEl.src : null;

  if (navigator.share) {
    try {
      let shareData = { title: "GeoShuffle Solve", text: shareText, url: shareUrl };

      // Try to attach the generated scorecard PNG image file if it exists
      if (dataUrl && dataUrl.startsWith("data:image")) {
        try {
          const file = dataURLtoFile(dataUrl, "geoshuffle-scorecard.png");
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (fileErr) {
          console.error("Failed to build file for sharing:", fileErr);
        }
      }

      await navigator.share(shareData);
      return;
    } catch (err) {
      console.warn("Native file sharing failed, trying text-only sharing:", err);
      // Fallback to text-only native sharing
      try {
        await navigator.share({ title: "GeoShuffle Solve", text: shareTextWithImg, url: shareUrl });
        return;
      } catch (fallbackErr) {
        console.error("Native text share failed:", fallbackErr);
      }
    }
  }

  // Fallback if HTTPS is missing or native share fails completely
  copyToClipboardFallback(shareTextWithImg);
});

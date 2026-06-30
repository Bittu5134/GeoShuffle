import {
  getPlayerName,
  setPlayerName,
  defaultNames,
  addLocalHistoryRun,
  submitScore,
  getScoreRank,
  fetchGlobalLeaderboard,
} from "./api.js";
import {
  shuffleBoard,
  renderBoard,
  registerCallbacks,
  getCurrentMap,
  getMoveCount,
  getNumberAssist,
  setNumberAssist,
  setGameActive,
} from "./game.js";
import {
  startTimer,
  stopTimer,
  resetTimer,
  getTimeElapsed,
  formatTime,
  updateLocationPanel,
} from "./timer.js";
import { generateScorecard } from "./scorecard.js";
import { setupSocialShareLinks, triggerNativeShare } from "./share.js";
import { triggerConfetti } from "./utils.js";

let activeGlobalTab = "time";
let activeLocalTab = "time";
let playerName = getPlayerName();

function setupProfile() {
  if (!localStorage.getItem("geoPlayerName")) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomPlaceholder = `${defaultNames[Math.floor(Math.random() * defaultNames.length)]}${randomNum}`;
    playerName = setPlayerName(randomPlaceholder);

    const modal = document.getElementById("name_prompt_modal");
    const input = document.getElementById("prompt-name-input");
    const saveBtn = document.getElementById("btn-save-name");

    if (modal && input && saveBtn) {
      input.value = randomPlaceholder;
      modal.showModal();

      saveBtn.addEventListener("click", () => {
        playerName = setPlayerName(input.value);
        const nameInput = document.getElementById("setting-name");
        if (nameInput) nameInput.value = playerName;
        modal.close();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveBtn.click();
      });
    }
  }

  const nameInput = document.getElementById("setting-name");
  if (nameInput) {
    nameInput.value = playerName;
    nameInput.addEventListener("input", (e) => {
      playerName = setPlayerName(e.target.value);
    });
  }
}

async function handleVictory() {
  stopTimer();
  triggerConfetti();

  const finalTime = getTimeElapsed();
  const finalMoves = getMoveCount();
  const dateStr = new Date().toLocaleDateString();

  addLocalHistoryRun({ date: dateStr, time: finalTime, moves: finalMoves });
  renderLocalLeaderboard();

  document.getElementById("victory-time").textContent = formatTime(finalTime);
  document.getElementById("victory-moves").textContent = finalMoves;
  document.getElementById("victory-rank").textContent = "#--";

  renderBoard(true);
  updateLocationPanel(getCurrentMap(), true);

  await submitScore(playerName, finalTime, finalMoves);
  const rank = await getScoreRank(finalTime);
  document.getElementById("victory-rank").textContent = rank;

  generateScorecard(getCurrentMap(), formatTime(finalTime), finalMoves, rank);
  setupSocialShareLinks(
    getCurrentMap(),
    formatTime(finalTime),
    finalMoves,
    rank,
  );

  renderGlobalLeaderboard();

  const victoryModal = document.getElementById("victory_modal");
  if (victoryModal) victoryModal.showModal();
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
      row.className = "border-b border-base-content/5 hover:bg-base-content/5";
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
      if (activeLocalTab === "time")
        return a.time - b.time || a.moves - b.moves;
      return a.moves - b.moves || a.time - b.time;
    })
    .slice(0, 5);

  sortedLocal.forEach((run, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-base-content/5 hover:bg-base-content/5";
    row.innerHTML = `
      <td class="py-2 font-black">#${i + 1}</td>
      <td>${run.date}</td>
      <td class="${activeLocalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(run.time)}</td>
      <td class="${activeLocalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${run.moves}</td>
    `;
    localBody.appendChild(row);
  });
}

function setupTabToggle(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
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

document.addEventListener("DOMContentLoaded", () => {
  setupProfile();

  document
    .getElementById("setting-numbers")
    ?.addEventListener("change", (e) => {
      setNumberAssist(e.target.checked);
      renderBoard(false);
    });

  const savedTheme = localStorage.getItem("geoTheme") || "geoshuffle";
  document.documentElement.setAttribute("data-theme", savedTheme);

  document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
    const targetTheme = btn.dataset.themeBtn;
    if (targetTheme === savedTheme) {
      const parent = btn.closest(".join");
      if (parent) {
        parent.querySelectorAll("button").forEach((b) => {
          b.classList.add("btn-ghost");
          b.classList.remove("bg-neutral", "text-base-100");
        });
        btn.classList.remove("btn-ghost");
        btn.classList.add("bg-neutral", "text-base-100");
      }
    }

    btn.addEventListener("click", (e) => {
      const parent = e.target.closest(".join");
      if (parent) {
        parent.querySelectorAll("button").forEach((b) => {
          b.classList.add("btn-ghost");
          b.classList.remove("bg-neutral", "text-base-100");
        });
      }
      e.target.classList.remove("btn-ghost");
      e.target.classList.add("bg-neutral", "text-base-100");

      let targetTheme = e.target.dataset.themeBtn;
      if (targetTheme === "auto") {
        targetTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      document.documentElement.setAttribute("data-theme", targetTheme);
      localStorage.setItem("geoTheme", targetTheme);
    });
  });

  setupTabToggle("global-tabs", (type) => {
    activeGlobalTab = type;
    renderGlobalLeaderboard();
  });

  setupTabToggle("local-tabs", (type) => {
    activeLocalTab = type;
    renderLocalLeaderboard();
  });

  document.getElementById("new-game")?.addEventListener("click", () => {
    resetTimer();
    document.getElementById("stat-time").textContent = "00:00";
    shuffleBoard(200);
  });

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
      resetTimer();
      document.getElementById("stat-time").textContent = "00:00";
      shuffleBoard(150);
    });
    victoryModalElement.addEventListener("click", (e) => {
      if (e.target === victoryModalElement) {
        victoryModalElement.close();
      }
    });
  }

  document
    .getElementById("btn-native-share")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      const finalTime = getTimeElapsed();
      const finalMoves = getMoveCount();
      const rank = document.getElementById("victory-rank").textContent;
      await triggerNativeShare(
        getCurrentMap(),
        formatTime(finalTime),
        finalMoves,
        rank,
      );
    });

  registerCallbacks(() => {
    if (getTimeElapsed() === 0 && getMoveCount() === 0) {
      startTimer((seconds) => {
        const timerEl = document.getElementById("stat-time");
        if (timerEl) timerEl.textContent = formatTime(seconds);
        updateLocationPanel(getCurrentMap(), false);
      });
    }
  }, handleVictory);

  setGameActive(false);
  shuffleBoard(200);
  renderGlobalLeaderboard();
  renderLocalLeaderboard();
});

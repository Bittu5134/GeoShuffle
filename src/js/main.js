import {
  getPlayerName,
  setPlayerName,
  generateRandomUsername,
  addLocalHistoryRun,
  submitScore,
  getScoreRank,
  fetchGlobalLeaderboard,
  getLocalHistory,
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
  getTiles,
  setTiles,
  setCurrentMap,
  getEarthData,
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
import { triggerConfetti, setupTabToggle } from "./utils.js";
import {
  initMultiplayer,
  hostGame,
  joinGame,
  startQuickMatch,
  cancelMultiplayer,
  getRoomCode,
  getRole,
  isConnected,
  sendGameStart,
  sendVictory,
  sendMoveUpdate,
  requestNewGame,
  disconnectOpponent,
  preConnectPeer,
  sendOpponentReadyReplay,
} from "./multiplayer.js";

let activeGlobalTab = "time";
let activeLocalTab = "time";
let playerName = getPlayerName();
let opponentSolved = false;
let weSolved = false;
let weClickedPlayAgain = false;
let opponentClickedPlayAgain = false;
let playAgainClicked = false;
let onlineCountIntervalId = null;

function setupProfile() {
  if (!localStorage.getItem("geoPlayerName")) {
    const randomPlaceholder = generateRandomUsername();
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

// --- MULTIPLAYER COORDINATION HANDLERS ---

function isRandomMatch() {
  const code = getRoomCode();
  return code && code.startsWith("MATCH-");
}

function handleMatchStart(mapIndex, tiles) {
  stopTimer();
  resetTimer();
  document.getElementById("stat-time").textContent = "00:00";

  opponentSolved = false;
  weSolved = false;
  weClickedPlayAgain = false;
  opponentClickedPlayAgain = false;

  const replayBtn = document.getElementById("btn-victory-replay");
  if (replayBtn) {
    replayBtn.disabled = false;
    replayBtn.classList.remove("btn-disabled");
    replayBtn.textContent = "Play Again";
  }

  const earthData = getEarthData();
  const map = earthData[mapIndex];
  setCurrentMap(map);
  setTiles(tiles);
  renderBoard(false);
  updateLocationPanel(map, false);

  document.getElementById("stat-moves").textContent = "0";
  document.getElementById("stat-opponent-moves").textContent = "0";
  document.getElementById("mp-status-text").textContent =
    "Match started! Solve the board!";

  setGameActive(true);

  startTimer((seconds) => {
    const timerEl = document.getElementById("stat-time");
    if (timerEl) timerEl.textContent = formatTime(seconds);
    updateLocationPanel(map, false);
  });

  const newGameBtn = document.getElementById("new-game");
  if (newGameBtn) {
    newGameBtn.disabled = true;
    newGameBtn.classList.add("btn-disabled");
  }
}

function handleOpponentReadyReplay() {
  opponentClickedPlayAgain = true;

  const statusText = document.getElementById("mp-status-text");
  if (statusText) {
    if (getRole() === "host") {
      statusText.textContent = "Guest ready. Click Play Again to start.";
    } else {
      statusText.textContent = "Host ready. Click Play Again to accept.";
    }
  }

  if (!isRandomMatch()) {
    if (weClickedPlayAgain) {
      if (getRole() === "host") {
        const earthData = getEarthData();
        const randomMapIdx = Math.floor(Math.random() * earthData.length);
        shuffleBoard(
          5,
          () => {
            const map = earthData[randomMapIdx];
            setCurrentMap(map);
            sendGameStart(randomMapIdx, getTiles());
            handleMatchStart(randomMapIdx, getTiles());
          },
          map,
        );
      } else {
        requestNewGame();
      }
    } else {
      const replayBtn = document.getElementById("btn-victory-replay");
      if (replayBtn) {
        replayBtn.textContent = "Play Again (Opponent Ready)";
      }
    }
  }
}

function handleOpponentMove(moves) {
  const oppMovesEl = document.getElementById("stat-opponent-moves");
  if (oppMovesEl) oppMovesEl.textContent = moves;
}

function handleOpponentVictory(timeSpent, movesMade) {
  opponentSolved = true;
  const statusText = document.getElementById("mp-status-text");
  if (statusText) {
    statusText.textContent = `Opponent solved in ${formatTime(timeSpent)} (${movesMade} moves). Keep solving!`;
    statusText.classList.add("text-rose-600");
  }

  // If in quick match and we haven't finished yet, present options
  if (isRandomMatch() && !weSolved) {
    const oppWonTimeEl = document.getElementById("opp-won-time");
    const oppWonMovesEl = document.getElementById("opp-won-moves");
    if (oppWonTimeEl) oppWonTimeEl.textContent = formatTime(timeSpent);
    if (oppWonMovesEl) oppWonMovesEl.textContent = movesMade;

    const oppWonModal = document.getElementById("opponent_won_modal");
    if (oppWonModal) oppWonModal.showModal();
  }

  // If we are in a private match and we already completed it, activate the Play Again button!
  if (isConnected() && !isRandomMatch() && weSolved) {
    const replayBtn = document.getElementById("btn-victory-replay");
    if (replayBtn) {
      replayBtn.disabled = false;
      replayBtn.classList.remove("btn-disabled");
      replayBtn.textContent = "Play Again";
    }
  }
}

function handleOpponentDisconnect() {
  if (isRandomMatch()) {
    // If it was a quick match, do NOT go back to solo automatically!
    const statusText = document.getElementById("mp-status-text");
    if (statusText) {
      if (weSolved) {
        statusText.textContent = "Opponent left. Rematch search ready.";
      } else {
        statusText.textContent =
          "Opponent disconnected. You can finish solving this board or start a new search.";
      }
      statusText.classList.remove("text-rose-600");
    }

    // Hide opponent moves stats since opponent left
    document.getElementById("stat-opponent-container")?.classList.add("hidden");

    const replayBtn = document.getElementById("btn-victory-replay");
    if (replayBtn) {
      replayBtn.disabled = false;
      replayBtn.classList.remove("btn-disabled");
      replayBtn.textContent = "Play Again";
    }
    return;
  }

  const statusText = document.getElementById("mp-status-text");
  if (statusText) {
    statusText.textContent = "Opponent disconnected. Returning to Solo Mode.";
    statusText.classList.remove("text-rose-600");
  }

  document.getElementById("stat-opponent-container")?.classList.add("hidden");
  document.getElementById("mp-room-badge")?.classList.add("hidden");
  document.getElementById("mp-panel-status")?.classList.add("hidden");

  const newGameBtn = document.getElementById("new-game");
  if (newGameBtn) {
    newGameBtn.disabled = false;
    newGameBtn.classList.remove("btn-disabled");
  }

  // Also unlock replay button if opponent disconnected
  const replayBtn = document.getElementById("btn-victory-replay");
  if (replayBtn) {
    replayBtn.disabled = false;
    replayBtn.classList.remove("btn-disabled");
    replayBtn.textContent = "Play Again";
  }

  const disconnectBtn = document.getElementById("btn-cancel-mp");
  if (disconnectBtn) disconnectBtn.classList.add("hidden");
}

function handleStatusUpdate(status) {
  const statusText = document.getElementById("mp-status-text");
  if (statusText) {
    statusText.textContent = status;
    statusText.classList.remove("text-rose-600");
  }

  const code = getRoomCode();
  const active =
    isConnected() ||
    !!code ||
    status.includes("Searching") ||
    status.includes("Handshaking");

  const statusBadge = document.getElementById("mp-panel-status");
  if (statusBadge) {
    if (active) statusBadge.classList.remove("hidden");
    else statusBadge.classList.add("hidden");
  }

  const disconnectBtn = document.getElementById("btn-cancel-mp");
  if (disconnectBtn) {
    if (active) disconnectBtn.classList.remove("hidden");
    else disconnectBtn.classList.add("hidden");
  }

  const badge = document.getElementById("mp-room-badge");
  const codeEl = document.getElementById("mp-room-code");
  if (code) {
    if (badge) badge.classList.remove("hidden");
    if (codeEl) codeEl.textContent = code;
  } else {
    if (badge) badge.classList.add("hidden");
  }

  const oppContainer = document.getElementById("stat-opponent-container");
  if (oppContainer) {
    if (isConnected()) oppContainer.classList.remove("hidden");
    else oppContainer.classList.add("hidden");
  }
}

async function handleVictory() {
  stopTimer();
  triggerConfetti();

  const finalTime = getTimeElapsed();
  const finalMoves = getMoveCount();
  const dateStr = new Date().toLocaleDateString();

  weSolved = true;
  playAgainClicked = false;

  if (isConnected()) {
    sendVictory(finalTime, finalMoves);
  }

  addLocalHistoryRun({ date: dateStr, time: finalTime, moves: finalMoves });
  renderLocalLeaderboard();

  document.getElementById("victory-time").textContent = formatTime(finalTime);
  document.getElementById("victory-moves").textContent = finalMoves;
  document.getElementById("victory-rank").textContent = "#--";

  const puns = [
    "The equator called. It has no comment.",
    "Somewhere, a mountain just felt slightly disrespected.",
    "Tectonic plates shifted 2cm during that round. Unrelated, probably.",
    "A river changed course out of sheer boredom.",
    "Google Maps is taking notes.",
    "This message was brought to you by the letter N, for North.",
    "A cartographer somewhere just sighed.",
    "Fun fact: none of that was on the test.",
    "The Earth is still round, for now.",
    "This round has been added to the historical record. Probably.",
    "A GPS satellite blinked in confusion.",
    "This has been a public geography moment.",
    "No continents were harmed in the making of this round.",
    "The Pacific Ocean remains unimpressed.",
    "A globe spun somewhere, just because.",
    "Compasses everywhere pointed vaguely in your direction.",
    "That's on brand for planet Earth, honestly.",
    "An unnamed island is jealous of the attention.",
    "Latitude and longitude have entered the chat.",
    "This has been today's rotation of the Earth. Thanks for riding along.",
  ];
  const randomPun = puns[Math.floor(Math.random() * puns.length)];
  const subtitleEl = document.getElementById("victory-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = randomPun;
  }

  renderBoard(true);
  updateLocationPanel(getCurrentMap(), true);

  // If in private lobby and opponent hasn't solved yet, wait for them!
  if (isConnected() && !isRandomMatch()) {
    const replayBtn = document.getElementById("btn-victory-replay");
    if (replayBtn) {
      if (!opponentSolved) {
        replayBtn.disabled = true;
        replayBtn.classList.add("btn-disabled");
        replayBtn.textContent = "Waiting for Opponent...";
      } else {
        replayBtn.disabled = false;
        replayBtn.classList.remove("btn-disabled");
        replayBtn.textContent = "Play Again";
      }
    }
  }

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
  if (victoryModal) {
    victoryModal.showModal();
    setTimeout(() => {
      document.getElementById("btn-victory-replay")?.focus();
    }, 50);
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

  const localHistory = getLocalHistory();
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


document.addEventListener("DOMContentLoaded", () => {
  setupProfile();

  window.toggleMpPanel = function () {
    const content = document.getElementById("mp-panel-content");
    const toggle = document.getElementById("mp-panel-toggle");
    if (!content || !toggle) return;
    if (content.classList.contains("hidden")) {
      content.classList.remove("hidden");
      toggle.textContent = "Collapse ▲";
      preConnectPeer(); // Warm up connection

      // Start global online count polling on expand!
      if (!onlineCountIntervalId) {
        updateOnlineCount();
        onlineCountIntervalId = setInterval(updateOnlineCount, 45000);
      }
    } else {
      content.classList.add("hidden");
      toggle.textContent = "Expand ▼";
    }
  };

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
    shuffleBoard(5);
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

  async function updateOnlineCount() {
    const countEl = document.getElementById("mp-online-count");
    if (!countEl) return;
    try {
      const probeId = "probe-" + Math.random().toString(36).substring(2, 8);
      const res = await fetch(
        "https://peerbasket.bittu.dev/basket/geoshuffle-online?limit=1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peer_id: probeId }),
        },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      countEl.textContent = `${data.total_peers} online`;
      countEl.classList.remove("opacity-50", "hidden");
    } catch (err) {
      countEl.textContent = "Online";
      countEl.classList.add("opacity-50");
      countEl.classList.remove("hidden");
    }
  }

  const victoryModalElement = document.getElementById("victory_modal");
  if (victoryModalElement) {
    document
      .getElementById("btn-victory-replay")
      ?.addEventListener("click", () => {
        playAgainClicked = true;
      });

    victoryModalElement.addEventListener("close", () => {
      if (playAgainClicked) {
        weClickedPlayAgain = true;

        if (isRandomMatch()) {
          // Quick Match: immediately search for a new game
          startQuickMatch();
        } else if (isConnected()) {
          // Private Lobby: both need to click Play Again before Host starts!
          sendOpponentReadyReplay();

          if (opponentClickedPlayAgain) {
            if (getRole() === "host") {
              const earthData = getEarthData();
              const randomMapIdx = Math.floor(Math.random() * earthData.length);
              const map = earthData[randomMapIdx];
              shuffleBoard(
                5,
                () => {
                  sendGameStart(randomMapIdx, getTiles());
                  handleMatchStart(randomMapIdx, getTiles());
                },
                map,
              );
            } else {
              resetTimer();
              document.getElementById("stat-time").textContent = "00:00";
              document.getElementById("mp-status-text").textContent =
                "Replay requested. Starting soon...";
              requestNewGame();
            }
          } else {
            // Waiting for opponent
            resetTimer();
            document.getElementById("stat-time").textContent = "00:00";
            if (getRole() === "host") {
              document.getElementById("mp-status-text").textContent =
                "Replay ready. Waiting for guest...";
            } else {
              document.getElementById("mp-status-text").textContent =
                "Replay ready. Waiting for host...";
            }
          }
        } else {
          // Solo mode - play again
          resetTimer();
          document.getElementById("stat-time").textContent = "00:00";
          shuffleBoard(5);
        }
      } else {
        // Exited victory modal without choosing Play Again (clicked Close or closed window)
        resetTimer();
        document.getElementById("stat-time").textContent = "00:00";
        if (isConnected() || isRandomMatch()) {
          // Disconnect from multiplayer game if exited without choosing play again
          cancelMultiplayer();
        }
      }
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

  // --- MULTIPLAYER P2P INITIALIZATION ---
  initMultiplayer({
    onStatusUpdate: handleStatusUpdate,
    onConnectionEstablished: () => {
      if (getRole() === "host") {
        const earthData = getEarthData();
        const randomMapIdx = Math.floor(Math.random() * earthData.length);
        const map = earthData[randomMapIdx];

        // Host shuffles board first, then shares with Guest
        shuffleBoard(
          5,
          () => {
            sendGameStart(randomMapIdx, getTiles());
            handleMatchStart(randomMapIdx, getTiles());
          },
          map,
        );
      }
    },
    onMatchStart: handleMatchStart,
    onOpponentMove: handleOpponentMove,
    onOpponentVictory: handleOpponentVictory,
    onOpponentDisconnect: handleOpponentDisconnect,
    onRequestNewGame: () => {
      if (getRole() === "host" && weClickedPlayAgain) {
        const earthData = getEarthData();
        const randomMapIdx = Math.floor(Math.random() * earthData.length);
        const map = earthData[randomMapIdx];
        shuffleBoard(
          5,
          () => {
            sendGameStart(randomMapIdx, getTiles());
            handleMatchStart(randomMapIdx, getTiles());
          },
          map,
        );
      }
    },
    onOpponentReadyReplay: handleOpponentReadyReplay,
  });

  // Bind Multiplayer Control Panel Buttons
  document.getElementById("btn-quick-match")?.addEventListener("click", () => {
    setGameActive(false);
    stopTimer();
    startQuickMatch();
  });

  document.getElementById("btn-host-lobby")?.addEventListener("click", () => {
    setGameActive(false);
    stopTimer();
    hostGame();
  });

  document.getElementById("btn-join-lobby")?.addEventListener("click", () => {
    const codeInput = document.getElementById("mp-join-input");
    if (codeInput && codeInput.value.trim()) {
      setGameActive(false);
      stopTimer();
      joinGame(codeInput.value.trim());
    }
  });

  document.getElementById("btn-cancel-mp")?.addEventListener("click", () => {
    cancelMultiplayer();

    // Enable Manual Shuffle button
    const newGameBtn = document.getElementById("new-game");
    if (newGameBtn) {
      newGameBtn.disabled = false;
      newGameBtn.classList.remove("btn-disabled");
    }
  });

  document.getElementById("btn-opp-won-keep")?.addEventListener("click", () => {
    const oppWonModal = document.getElementById("opponent_won_modal");
    if (oppWonModal) oppWonModal.close();
  });

  document.getElementById("btn-opp-won-new")?.addEventListener("click", () => {
    const oppWonModal = document.getElementById("opponent_won_modal");
    if (oppWonModal) oppWonModal.close();
    setGameActive(false);
    stopTimer();
    startQuickMatch();
  });

  registerCallbacks(
    () => {
      if (getTimeElapsed() === 0 && getMoveCount() === 0) {
        startTimer((seconds) => {
          const timerEl = document.getElementById("stat-time");
          if (timerEl) timerEl.textContent = formatTime(seconds);
          updateLocationPanel(getCurrentMap(), false);
        });
      }
    },
    handleVictory,
    (moves) => {
      if (isConnected()) {
        sendMoveUpdate(moves);
      }
    },
  );

  // Online count is initialized on multiplayer panel expansion

  setGameActive(false);
  shuffleBoard(5);
  renderGlobalLeaderboard();
  renderLocalLeaderboard();
});

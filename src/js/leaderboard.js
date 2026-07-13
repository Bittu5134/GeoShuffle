import { fetchGlobalLeaderboard, getLocalHistory } from "./api.js";
import { formatTime } from "./timer.js";
import { setupTabToggle } from "./utils.js";

let activeGlobalTab = "time";
let activeLocalTab = "time";

async function renderFullLeaderboard() {
  const tbody = document.querySelector("#full-table tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">Loading rankings...</td></tr>`;

  const data = await fetchGlobalLeaderboard(activeGlobalTab, 100);

  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">No rankings submitted yet!</td></tr>`;
    return;
  }

  data.forEach((player, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-base-content/5 hover:bg-base-content/5";
    row.innerHTML = `
      <td class="py-3 font-black text-amber-600">#${i + 1}</td>
      <td>${player.player_name}</td>
      <td class="${activeGlobalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(player.time_spent)}</td>
      <td class="${activeGlobalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${player.moves_made}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderLocalLeaderboard() {
  const localBody = document.querySelector("#local-table tbody");
  if (!localBody) return;

  localBody.innerHTML = "";
  const localHistory = getLocalHistory();

  if (localHistory.length === 0) {
    localBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">No finishes yet! Log a run to begin.</td></tr>`;
    return;
  }

  const sortedLocal = [...localHistory]
    .sort((a, b) => {
      if (activeLocalTab === "time")
        return a.time - b.time || a.moves - b.moves;
      return a.moves - b.moves || a.time - b.time;
    })
    .slice(0, 100);

  sortedLocal.forEach((run, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-base-content/5 hover:bg-base-content/5";
    row.innerHTML = `
      <td class="py-3 font-black">#${i + 1}</td>
      <td>${run.date}</td>
      <td class="${activeLocalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(run.time)}</td>
      <td class="${activeLocalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${run.moves}</td>
    `;
    localBody.appendChild(row);
  });
}



document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("geoTheme") || "geoshuffle";
  document.documentElement.setAttribute("data-theme", savedTheme);

  setupTabToggle("full-tabs", (type) => {
    activeGlobalTab = type;
    renderFullLeaderboard();
  });

  setupTabToggle("local-tabs", (type) => {
    activeLocalTab = type;
    renderLocalLeaderboard();
  });

  renderFullLeaderboard();
  renderLocalLeaderboard();
});

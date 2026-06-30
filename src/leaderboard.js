const SUPABASE_URL = "https://rmkplarqcrktdjpkegyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_uRHRP8GLVvPE1WCJ1UoWkw_Cwqm_Vn6";
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

let activeGlobalTab = "time";
let activeLocalTab = "time";

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

async function fetchFullLeaderboard(tab = "time") {
  const column = tab === "time" ? "time_spent" : "moves_made";
  const url = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name,time_spent,moves_made&order=${column}.asc&limit=100`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch full leaderboard:", err);
    return [];
  }
}

async function renderFullLeaderboard() {
  const tbody = document.querySelector("#full-table tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">Loading rankings...</td></tr>`;

  const data = await fetchFullLeaderboard(activeGlobalTab);

  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">No rankings submitted yet!</td></tr>`;
    return;
  }

  data.forEach((player, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-main-text/5 hover:bg-main-text/5";
    row.innerHTML = `
      <td class="py-3 font-black text-amber-600">#${i + 1}</td>
      <td>${player.player_name}</td>
      <td class="${activeGlobalTab === "time" ? "text-emerald-700 font-extrabold" : ""}">${formatTime(player.time_spent)}</td>
      <td class="${activeGlobalTab === "moves" ? "text-emerald-700 font-extrabold" : ""}">${player.moves_made}</td>
    `;
    tbody.appendChild(row);
  });
}

async function renderLocalLeaderboard() {
  const localBody = document.querySelector("#local-table tbody");
  if (!localBody) return;

  localBody.innerHTML = "";
  const localHistory = JSON.parse(localStorage.getItem("geoHistory")) || [];

  if (localHistory.length === 0) {
    localBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center opacity-50 italic">No finishes yet! Log a run to begin.</td></tr>`;
    return;
  }

  // Sort local history based on tab choice (time or moves)
  const sortedLocal = [...localHistory]
    .sort((a, b) => {
      if (activeLocalTab === "time") return a.time - b.time || a.moves - b.moves;
      return a.moves - b.moves || a.time - b.time;
    })
    .slice(0, 100); // Show up to 100 local runs

  sortedLocal.forEach((run, i) => {
    const row = document.createElement("tr");
    row.className = "border-b border-main-text/5 hover:bg-main-text/5";
    row.innerHTML = `
      <td class="py-3 font-black">#${i + 1}</td>
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

// Initializations
document.addEventListener("DOMContentLoaded", () => {
  // Restore theme preference
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

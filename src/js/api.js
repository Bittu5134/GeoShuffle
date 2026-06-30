const SUPABASE_URL = "https://rmkplarqcrktdjpkegyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_uRHRP8GLVvPE1WCJ1UoWkw_Cwqm_Vn6";
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export function getPlayerName() {
  return localStorage.getItem("geoPlayerName") || "Anonymous";
}

export function setPlayerName(name) {
  const cleanName = (name || "Anonymous").trim().substring(0, 15);
  localStorage.setItem("geoPlayerName", cleanName);
  return cleanName;
}

export function getLocalHistory() {
  return JSON.parse(localStorage.getItem("geoHistory")) || [];
}

export function addLocalHistoryRun(run) {
  const history = getLocalHistory();
  history.push(run);
  localStorage.setItem("geoHistory", JSON.stringify(history));
  return history;
}

export async function fetchGlobalLeaderboard(tab = "time", limit = 10) {
  const column = tab === "time" ? "time_spent" : "moves_made";
  const url = `${SUPABASE_URL}/rest/v1/leaderboard?select=player_name,time_spent,moves_made&order=${column}.asc&limit=${limit}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch global leaderboard:", err);
    return [];
  }
}

export async function submitScore(name, time, moves) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        player_name: name,
        time_spent: time,
        moves_made: moves,
      }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(`Failed to submit score: ${JSON.stringify(errData)}`);
    }
  } catch (err) {
    console.error("Failed to submit score:", err);
  }
}

export async function getScoreRank(timeSpent) {
  const url = `${SUPABASE_URL}/rest/v1/leaderboard?time_spent=lt.${timeSpent}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { ...headers, Prefer: "count=exact" },
    });
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

export const defaultNames = [
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

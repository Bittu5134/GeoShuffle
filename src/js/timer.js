let timerInterval = null;
let timeElapsed = 0;

export function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function startTimer(onTick) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed++;
    if (onTick) onTick(timeElapsed);
  }, 1000);
}

export function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

export function resetTimer() {
  stopTimer();
  timeElapsed = 0;
  return timeElapsed;
}

export function getTimeElapsed() {
  return timeElapsed;
}

export function setTimeElapsed(val) {
  timeElapsed = val;
}

export function updateLocationPanel(currentMap, showFullDetails = false) {
  const detailsEl = document.getElementById("location-details");
  const linkEl = document.getElementById("location-link");
  if (!detailsEl || !linkEl) return;

  if (showFullDetails) {
    const locationName = [currentMap.region, currentMap.country].filter(Boolean).join(", ");
    detailsEl.textContent = locationName || "Unknown Location";
    linkEl.href = currentMap.map || "#";
    linkEl.textContent = "🌐 View on Google Maps";
    linkEl.className = "btn btn-success font-bold rounded-xl text-xs sm:text-sm shadow-md";
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

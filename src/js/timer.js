import { gsap } from "gsap";
import iconsUrl from "../assets/icons.svg?url";

// TESTING HOOK: drop this to ~5s to exercise the reveal path without waiting.
// 45s is the production cooldown.
export const HINT_DELAY_SECONDS = 45;

let timerInterval = null;
let timeElapsed = 0;

// The sprite must be referenced through the bundler (hashed asset URL in
// production, ./assets in dev) — a hardcoded "./assets/icons.svg" 404s after
// a build, which is why the pin icon went missing.
function pinLabel(text) {
  return `<svg class="size-5 shrink-0 fill-current" aria-hidden="true"><use href="${iconsUrl}#pin"></use></svg><span>${text}</span>`;
}

export function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
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
    const locationName = [currentMap.region, currentMap.country]
      .filter(Boolean)
      .join(", ");

    const targetText = locationName || "Unknown Location";
    if (detailsEl.textContent !== targetText) {
      gsap.to(detailsEl, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          detailsEl.textContent = targetText;
          gsap.to(detailsEl, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        },
      });
    }
    linkEl.href = currentMap.map || "#";
    linkEl.setAttribute("target", "_blank");
    linkEl.removeAttribute("tabindex");
    linkEl.removeAttribute("aria-disabled");
    linkEl.innerHTML = pinLabel("View on Google Maps");
    linkEl.className =
      "neo-btn neo-btn-flat neo-btn-success px-3 py-2 text-xs sm:text-sm font-bold";
    linkEl.style.opacity = "1";
  } else {
    detailsEl.textContent = "Location is hidden!";

    if (timeElapsed >= HINT_DELAY_SECONDS) {
      linkEl.href = currentMap.map || "#";
      linkEl.setAttribute("target", "_blank");
      linkEl.removeAttribute("tabindex");
      linkEl.removeAttribute("aria-disabled");
      linkEl.innerHTML = pinLabel("Open in Maps");
      linkEl.className =
        "neo-btn neo-btn-flat neo-btn-outline px-3 py-2 text-xs sm:text-sm font-bold";
      linkEl.style.opacity = "1";
    } else {
      linkEl.href = "#";
      linkEl.removeAttribute("target");
      // Cooldown state: not an actionable control. Non-focusable, no hover
      // lift, no click-through — it is just a countdown label.
      linkEl.setAttribute("aria-disabled", "true");
      linkEl.setAttribute("tabindex", "-1");
      linkEl.innerHTML = pinLabel(`Hint in ${HINT_DELAY_SECONDS - timeElapsed}s`);
      linkEl.className =
        "neo-btn neo-btn-flat neo-btn-outline px-3 py-2 text-xs sm:text-sm font-bold pointer-events-none";
      linkEl.style.opacity = "0.5";
    }
  }
}

export function triggerConfetti() {
  if (typeof confetti !== "function") return;
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      zIndex: 10000,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      zIndex: 10000,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

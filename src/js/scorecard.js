export function dataURLtoFile(dataurl, filename) {
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

export function generateScorecard(currentMap, timeText, movesText, rankText) {
  const previewImg = document.getElementById("scorecard-preview");
  const loadingEl = document.getElementById("scorecard-loading");
  const downloadBtn = document.getElementById("btn-download-scorecard");

  if (!previewImg || !loadingEl) return;

  previewImg.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const baseImg = new Image();

  if (currentMap.image.startsWith("http")) {
    baseImg.crossOrigin = "anonymous";
    baseImg.src =
      "https://images.weserv.nl/?url=" + encodeURIComponent(currentMap.image);
  } else {
    baseImg.src = currentMap.image;
  }

  baseImg.onload = () => {
    const w = baseImg.naturalWidth || 800;
    const h = baseImg.naturalHeight || 533;
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(baseImg, 0, 0, w, h);

    const bannerHeight = Math.floor(h * 0.28);

    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 6;

    const logoX = Math.floor(w * 0.04);
    const logoY = Math.floor(h * 0.09);
    ctx.font = `900 ${Math.floor(h * 0.07)}px Fredoka, sans-serif`;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.floor(h * 0.015);
    ctx.lineJoin = "round";
    ctx.strokeText("GEOSHUFFLE", logoX, logoY);

    ctx.fillStyle = "#facc15";
    ctx.fillText("GEOSHUFFLE", logoX, logoY);

    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";

    const locationName = [currentMap.region, currentMap.country]
      .filter(Boolean)
      .join(", ");

    const solvedLocText = "Location";
    const solvedLocX = Math.floor(w * 0.04);
    const solvedLocY = h - Math.floor(bannerHeight * 0.65);
    ctx.font = `${Math.floor(h * 0.03)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(2, Math.floor(h * 0.007));
    ctx.strokeText(solvedLocText, solvedLocX, solvedLocY);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(solvedLocText, solvedLocX, solvedLocY);

    const locX = Math.floor(w * 0.04);
    const locY = h - Math.floor(bannerHeight * 0.35);
    ctx.font = `900 ${Math.floor(h * 0.05)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(3, Math.floor(h * 0.01));
    ctx.strokeText(locationName || "Unknown Location", locX, locY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(locationName || "Unknown Location", locX, locY);

    ctx.textAlign = "right";

    const statsText = `${timeText}  |  ${movesText} moves  |  Rank ${rankText}`;
    const statsX = w - Math.floor(w * 0.04);
    const statsY = h - Math.floor(bannerHeight * 0.35);
    ctx.font = `bold ${Math.floor(h * 0.042)}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(3, Math.floor(h * 0.009));
    ctx.strokeText(statsText, statsX, statsY);
    ctx.fillStyle = "#34d399";
    ctx.fillText(statsText, statsX, statsY);

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

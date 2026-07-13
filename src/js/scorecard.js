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

  if (previewImg) previewImg.classList.add("hidden");
  if (loadingEl) loadingEl.classList.remove("hidden");

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
    // Postcard dimensions: high resolution (800 x 950)
    const w = 800;
    const h = 950;
    canvas.width = w;
    canvas.height = h;

    // 1. App Base Background color (base-100 cream)
    ctx.fillStyle = "#fff9e6";
    ctx.fillRect(0, 0, w, h);

    // 2. Thick outer neutral border (hunter green)
    ctx.strokeStyle = "#173a31";
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // 3. Cropped satellite image (object-fit: cover)
    const imgX = 40;
    const imgY = 40;
    const imageWidth = 720;
    const imageHeight = 480;

    ctx.fillStyle = "#e8dfc7";
    ctx.fillRect(imgX, imgY, imageWidth, imageHeight);

    const iw = baseImg.naturalWidth || 800;
    const ih = baseImg.naturalHeight || 533;
    const r = Math.min(iw / imageWidth, ih / imageHeight);
    const sx = (iw - imageWidth * r) / 2;
    const sy = (ih - imageHeight * r) / 2;
    const sWidth = imageWidth * r;
    const sHeight = imageHeight * r;

    ctx.drawImage(
      baseImg,
      sx,
      sy,
      sWidth,
      sHeight,
      imgX,
      imgY,
      imageWidth,
      imageHeight,
    );

    // Border around the image
    ctx.strokeStyle = "#173a31";
    ctx.lineWidth = 8;
    ctx.strokeRect(imgX, imgY, imageWidth, imageHeight);

    // 4. Large "GEOSHUFFLE" badge/sticker in top-left
    ctx.save();
    ctx.translate(160, 90);
    ctx.rotate(-0.08); // slight slant

    // Badge shadow
    ctx.fillStyle = "#173a31";
    ctx.fillRect(-105 + 5, -25 + 5, 210, 50);

    // Badge background (warning yellow)
    ctx.fillStyle = "#eab308";
    ctx.fillRect(-105, -25, 210, 50);
    ctx.strokeStyle = "#173a31";
    ctx.lineWidth = 5;
    ctx.strokeRect(-105, -25, 210, 50);

    // Badge text (larger size)
    ctx.fillStyle = "#173a31";
    ctx.font = "900 24px Outfit, Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GEOSHUFFLE", 0, 0);
    ctx.restore();

    // 5. Location Section
    const locationName = [currentMap.region, currentMap.country]
      .filter(Boolean)
      .join(", ");

    ctx.fillStyle = "rgba(23, 58, 49, 0.6)";
    ctx.font = "900 14px Outfit, Fredoka, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("LOCATION", 40, 550);

    ctx.fillStyle = "#173a31";
    ctx.font = "900 36px Outfit, Fredoka, sans-serif";
    ctx.fillText(locationName || "Unknown Location", 40, 575);

    // 6. Stats Cards Grid matching the Victory Modal style (base-200 cards)
    const cardY = 660;
    const cardH = 110;
    const cardW = 220;
    const gap = 30;

    const rankVal = rankText
      ? String(rankText).startsWith("#")
        ? rankText
        : "#" + rankText
      : "#--";

    function drawStatCard(x, label, value, accentColor) {
      // Neobrutalist shadow offset
      ctx.fillStyle = "#173a31";
      ctx.fillRect(x + 6, cardY + 6, cardW, cardH);

      // Card background (base-200 cream-beige)
      ctx.fillStyle = "#e8dfc7";
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeStyle = "#173a31";
      ctx.lineWidth = 5;
      ctx.strokeRect(x, cardY, cardW, cardH);

      // Card Label
      ctx.fillStyle = "#173a31";
      ctx.font = "900 13px Outfit, Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, x + cardW / 2, cardY + 22);

      // Card Value (matching modal text-emerald-700 / text-amber-600)
      ctx.fillStyle = accentColor;
      ctx.font = "900 32px Outfit, Fredoka, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(value, x + cardW / 2, cardY + 70);
    }

    drawStatCard(40, "⏱️ TIME", timeText, "#047857");
    drawStatCard(40 + cardW + gap, "⚡ MOVES", String(movesText), "#047857");
    drawStatCard(40 + (cardW + gap) * 2, "🏆 RANK", rankVal, "#b45309");

    // 7. Larger Watermark Domain Name at bottom left
    ctx.fillStyle = "#173a31";
    ctx.font = "900 20px Outfit, Fredoka, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("geoshuffle.bittu.dev", 40, 890);

    // 8. Passport Stamp on the bottom right (coral red)
    ctx.save();
    ctx.translate(700, 860);
    ctx.rotate(0.18);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;

    // Outer Circle
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Circle
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Stamp text
    ctx.fillStyle = "#ef4444";
    ctx.font = "900 11px Outfit, Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PASSPORT", 0, -12);
    ctx.font = "900 14px Outfit, Fredoka, sans-serif";
    ctx.fillText("SOLVED", 0, 8);
    ctx.restore();

    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (previewImg) {
        previewImg.src = dataUrl;
        previewImg.classList.remove("hidden");
      }
      if (loadingEl) {
        loadingEl.classList.add("hidden");
      }
      if (downloadBtn) {
        downloadBtn.href = dataUrl;
      }
    } catch (e) {
      console.error("Canvas export failed:", e);
      if (loadingEl) {
        loadingEl.classList.add("hidden");
      }
    }
  };

  baseImg.onerror = () => {
    console.error("Failed to load base image for canvas scorecard.");
    if (loadingEl) {
      loadingEl.classList.add("hidden");
    }
  };
}

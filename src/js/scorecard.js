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

// The scorecard is a PNG snapshot, so it can't inherit CSS variables the way
// the page does. Read the active daisy theme tokens at draw time instead of
// hardcoding hexes, so the card matches the theme the player is using.
function themeColor(name, fallback) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();
  return value || fallback;
}

const W = 800;
const H = 1000;
const MARGIN = 56;

function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y, { size = 13, color, align = "left" } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Space Mono", ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Inverse of the region font-size: shrink until the name fits the column.
function fittedSize(ctx, text, maxWidth, startSize, weight = 900) {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px Fredoka, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 22);
  return size;
}

export function generateScorecard(currentMap, timeText, movesText, rankText) {
  const previewImg = document.getElementById("scorecard-preview");
  const loadingEl = document.getElementById("scorecard-loading");
  const downloadBtn = document.getElementById("btn-download-scorecard");

  if (previewImg) previewImg.classList.add("hidden");
  if (loadingEl) loadingEl.classList.remove("hidden");
  // The card is drawn async (image + font load): keep the download control
  // inert until the data URL actually exists.
  downloadBtn?.classList.add("pointer-events-none", "opacity-60");

  const ink = themeColor("neutral", "#6b4423");
  const paper = themeColor("base-100", "#f3e7cc");
  const panel = themeColor("base-200", "#e8dfc7");
  const accent = themeColor("warning", "#e07b39");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const baseImg = new Image();

  if (currentMap.image.startsWith("http")) {
    baseImg.crossOrigin = "anonymous";
    baseImg.src =
      "https://images.weserv.nl/?url=" + encodeURIComponent(currentMap.image);
  } else {
    baseImg.src = currentMap.image;
  }

  const locationName =
    [currentMap.region, currentMap.country].filter(Boolean).join(", ") ||
    "Unknown Location";
  const rankRaw = rankText && String(rankText).trim();
  const hasRank = rankRaw && /\d/.test(rankRaw);
  const rankVal = hasRank
    ? String(rankRaw).startsWith("#")
      ? rankRaw
      : "#" + rankRaw
    : "—";

  const draw = () => {
    // ── Paper ────────────────────────────────────────────────────────────
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    // ── Outer ink frame (flat, no shadow) ────────────────────────────────
    ctx.strokeStyle = ink;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // ── Header: wordmark + tile motif ────────────────────────────────────
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = '900 46px Fredoka, sans-serif';
    ctx.fillText("GeoShuffle", MARGIN, 112);

    // 6x1 mini tile strip: a nod to the puzzle grid
    const tileY = 84;
    const tileSize = 26;
    const stripW = tileSize * 6;
    const stripX = W - MARGIN - stripW;
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.strokeRect(stripX + i * tileSize, tileY, tileSize, tileSize);
    }
    ctx.fillStyle = accent;
    ctx.fillRect(stripX + 4 * tileSize + 6, tileY + 6, tileSize - 12, tileSize - 12);

    label(ctx, "UNSCRAMBLE THE PHOTO · REVEAL THE PLACE", MARGIN, 143, {
      size: 12,
      color: ink,
    });

    // ── Photograph ───────────────────────────────────────────────────────
    const imgX = MARGIN;
    const imgY = 172;
    const imgW = W - MARGIN * 2;
    const imgH = 432;

    ctx.save();
    roundRect(ctx, imgX, imgY, imgW, imgH, 14);
    ctx.clip();
    ctx.fillStyle = panel;
    ctx.fillRect(imgX, imgY, imgW, imgH);
    if (baseImg.naturalWidth) {
      // object-fit: cover
      const r = Math.max(
        imgW / baseImg.naturalWidth,
        imgH / baseImg.naturalHeight,
      );
      const dw = baseImg.naturalWidth * r;
      const dh = baseImg.naturalHeight * r;
      ctx.drawImage(
        baseImg,
        imgX + (imgW - dw) / 2,
        imgY + (imgH - dh) / 2,
        dw,
        dh,
      );
    }
    ctx.restore();

    ctx.strokeStyle = ink;
    ctx.lineWidth = 6;
    roundRect(ctx, imgX, imgY, imgW, imgH, 14);
    ctx.stroke();

    // ── Location ─────────────────────────────────────────────────────────
    label(ctx, "LOCATION", MARGIN, 660, { size: 13, color: ink });
    const nameSize = fittedSize(ctx, locationName, imgW, 44);
    ctx.fillStyle = ink;
    ctx.font = `900 ${nameSize}px Fredoka, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(locationName, MARGIN, 712);

    // ── Stat strip: one flat panel, two inner dividers ───────────────────
    const stripY = 748;
    const stripH = 116;
    roundRect(ctx, imgX, stripY, imgW, stripH, 14);
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.stroke();

    const cells = [
      { label: "TIME", value: timeText, color: ink },
      { label: "MOVES", value: String(movesText), color: ink },
      { label: "GLOBAL RANK", value: rankVal, color: accent },
    ];
    const cellW = imgW / 3;

    cells.forEach((cell, i) => {
      const cx = imgX + cellW * i + cellW / 2;

      if (i > 0) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(imgX + cellW * i, stripY + 8);
        ctx.lineTo(imgX + cellW * i, stripY + stripH - 8);
        ctx.stroke();
      }

      label(ctx, cell.label, cx, stripY + 44, {
        size: 12,
        color: ink,
        align: "center",
      });

      ctx.fillStyle = cell.color;
      ctx.font = '900 44px Fredoka, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(cell.value, cx, stripY + 92);
    });

    // ── Footer: handle + passport stamp ──────────────────────────────────
    ctx.fillStyle = ink;
    ctx.font = '900 22px Fredoka, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("geoshuffle.bittu.dev", MARGIN, 928);

    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.font = '700 12px "Space Mono", monospace';
    ctx.fillText("A CARTOGRAPHER SOMEWHERE JUST SIGHED", MARGIN, 953);
    ctx.restore();

    // stamp
    ctx.save();
    ctx.translate(W - MARGIN - 54, 918);
    ctx.rotate(-0.16);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = '700 10px "Space Mono", monospace';
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    ctx.fillText("SOLVED", 0, -7);
    ctx.font = '900 13px Fredoka, sans-serif';
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.fillText("GeoShuffle", 0, 14);
    ctx.restore();
  };

  // Export only after the draw actually ran (fonts may resolve a tick later).
  const finish = () => {
    draw();
    try {
      const dataUrl = canvas.toDataURL("image/png");
      if (previewImg) {
        previewImg.src = dataUrl;
        previewImg.classList.remove("hidden");
      }
      if (loadingEl) loadingEl.classList.add("hidden");
      if (downloadBtn) {
        downloadBtn.href = dataUrl;
        downloadBtn.classList.remove("pointer-events-none", "opacity-60");
      }
    } catch (e) {
      console.error("Canvas export failed:", e);
      if (loadingEl) loadingEl.classList.add("hidden");
      downloadBtn?.classList.remove("pointer-events-none", "opacity-60");
    }
  };

  baseImg.onload = () => {
    if (document.fonts?.ready) {
      // Canvas text needs the webfont settled or it silently falls back.
      document.fonts.ready.then(finish, finish);
    } else {
      finish();
    }
  };

  baseImg.onerror = () => {
    console.error("Failed to load base image for canvas scorecard.");
    if (loadingEl) loadingEl.classList.add("hidden");
    downloadBtn?.classList.remove("pointer-events-none", "opacity-60");
  };
}

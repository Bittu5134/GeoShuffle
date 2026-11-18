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

// ── Fixed share-poster palette ───────────────────────────────────────────────
// The card is a share asset, not part of the page UI: a fixed vibrant palette
// reads the same in every theme and lets the satellite photo stay the hero.
const INK = "#1B1E35"; // deep indigo — chrome, text on tiles
const WHITE = "#FDFDF8";
const LAVENDER = "#A7AEC8"; // muted secondary text on dark
const YELLOW = "#FFD93D";
const MINT = "#6EE7A8";
const SKY = "#6ECBFF";
const CORAL = "#FF6B6B";
const VIOLET = "#A78BFA";

const W = 1080;
const H = 1350;
const PAD = 60;

const PHOTO = { x: PAD, y: 170, w: W - PAD * 2, h: 640, r: 26 };

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

function displayFont(ctx, size) {
  // Fredoka ships in 300–700; 700 is its true boldest.
  ctx.font = `700 ${size}px Fredoka, sans-serif`;
}

function monoFont(ctx, size, weight = 700) {
  ctx.font = `${weight} ${size}px "Space Mono", ui-monospace, monospace`;
}

function setSpacing(ctx, px) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

// Darker variant of a palette colour, for hard offset tile shadows.
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

// The Google Maps URL carries the tile centre: "@30.109104,84.817876,15z".
function parseCoords(mapUrl) {
  const m = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(mapUrl || "");
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

// Fit the location name into the photo column; ellipsize past the floor.
function fittedName(ctx, text, maxWidth) {
  let size = 68;
  for (;;) {
    displayFont(ctx, size);
    if (ctx.measureText(text).width <= maxWidth) return { text, size };
    if (size <= 40) break;
    size -= 3;
  }
  displayFont(ctx, 40);
  if (ctx.measureText(text).width <= maxWidth) return { text, size: 40 };
  let cut = text.length - 1;
  while (cut > 1) {
    const t = text.slice(0, cut) + "…";
    if (ctx.measureText(t).width <= maxWidth) return { text: t, size: 40 };
    cut--;
  }
  return { text, size: 40 };
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
  const coords = parseCoords(currentMap.map);
  const rankRaw = rankText && String(rankText).trim();
  const hasRank = rankRaw && /\d/.test(rankRaw);
  const rankVal = hasRank
    ? String(rankRaw).startsWith("#")
      ? rankRaw
      : "#" + rankRaw
    : "—";
  const solvedDate = new Date()
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const draw = () => {
    // ── Ambient background: the photo itself, blurred and dimmed ────────
    // A tiny downscaled copy stretched back over the canvas gives a cheap
    // blur, so every card is washed in the colours of the place itself.
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    if (baseImg.naturalWidth) {
      const bg = document.createElement("canvas");
      bg.width = 108;
      bg.height = 135;
      const bctx = bg.getContext("2d");
      const r = Math.max(108 / baseImg.naturalWidth, 135 / baseImg.naturalHeight);
      const dw = baseImg.naturalWidth * r;
      const dh = baseImg.naturalHeight * r;
      bctx.drawImage(baseImg, (108 - dw) / 2, (135 - dh) / 2, dw, dh);
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.fillStyle = "rgba(21, 24, 44, 0.87)";
      ctx.fillRect(0, 0, W, H);
    }

    // ── Confetti: a few loose tiles in the header, kept off the photo ──
    const confetti = [
      { x: 356, y: 74, s: 14, rot: 0.3, c: CORAL },
      { x: 430, y: 118, s: 9, rot: -0.2, c: MINT },
      { x: 512, y: 92, s: 11, rot: 0.5, c: VIOLET },
      { x: 612, y: 66, s: 13, rot: -0.4, c: SKY },
      { x: 700, y: 104, s: 16, rot: 0.25, c: YELLOW },
      { x: 778, y: 70, s: 10, rot: -0.5, c: CORAL },
    ];
    confetti.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      roundRect(ctx, -p.s / 2, -p.s / 2, p.s, p.s, 4);
      ctx.fill();
      ctx.restore();
    });

    // ── Wordmark: 2×2 tile logo + name ──────────────────────────────────
    const tile = 18;
    const gap = 4;
    const logoX = PAD;
    const logoY = 64;
    // the "blank" tile slid half out of place — the shuffle, mid-solve
    const logoTiles = [
      { c: YELLOW, dx: 0, dy: 0 },
      { c: MINT, dx: tile + gap, dy: 0 },
      { c: SKY, dx: 0, dy: tile + gap },
      { c: CORAL, dx: tile + gap + 7, dy: tile + gap + 7 },
    ];
    logoTiles.forEach((p) => {
      ctx.fillStyle = p.c;
      roundRect(ctx, logoX + p.dx, logoY + p.dy, tile, tile, 5);
      ctx.fill();
    });

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    displayFont(ctx, 46);
    ctx.fillStyle = WHITE;
    ctx.fillText("Geo", logoX + 100, 112);
    const geoW = ctx.measureText("Geo").width;
    ctx.fillStyle = YELLOW;
    ctx.fillText("Shuffle", logoX + 100 + geoW, 112);

    // ── "SOLVED" sticker: the old passport stamp, reborn ────────────────
    ctx.save();
    ctx.translate(W - 158, 94);
    ctx.rotate(-0.09);
    // hard offset shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    roundRect(ctx, -104 + 6, -34 + 8, 208, 68, 34);
    ctx.fill();
    ctx.fillStyle = MINT;
    roundRect(ctx, -104, -34, 208, 68, 34);
    ctx.fill();
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3;
    roundRect(ctx, -104, -34, 208, 68, 34);
    ctx.stroke();
    // check mark
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-74, 0);
    ctx.lineTo(-58, 15);
    ctx.lineTo(-32, -16);
    ctx.stroke();
    // label
    ctx.fillStyle = INK;
    monoFont(ctx, 24);
    setSpacing(ctx, 3);
    ctx.textAlign = "center";
    ctx.fillText("SOLVED", 26, 9);
    setSpacing(ctx, 0);
    ctx.restore();

    // ── The photograph: hero, unobstructed ───────────────────────────────
    ctx.save();
    ctx.shadowColor = "rgba(6, 8, 18, 0.55)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = INK;
    roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
    ctx.fill();
    ctx.restore();

    // faint hairline just outside the frame, never over the image
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 2;
    roundRect(
      ctx,
      PHOTO.x - 3,
      PHOTO.y - 3,
      PHOTO.w + 6,
      PHOTO.h + 6,
      PHOTO.r + 3,
    );
    ctx.stroke();

    ctx.save();
    roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
    ctx.clip();
    if (baseImg.naturalWidth) {
      const r = Math.max(
        PHOTO.w / baseImg.naturalWidth,
        PHOTO.h / baseImg.naturalHeight,
      );
      const dw = baseImg.naturalWidth * r;
      const dh = baseImg.naturalHeight * r;
      ctx.drawImage(
        baseImg,
        PHOTO.x + (PHOTO.w - dw) / 2,
        PHOTO.y + (PHOTO.h - dh) / 2,
        dw,
        dh,
      );
    } else {
      ctx.fillStyle = "#2A2E4A";
      ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    }
    ctx.restore();

    // ── Destination ──────────────────────────────────────────────────────
    const name = fittedName(ctx, locationName, PHOTO.w);
    displayFont(ctx, name.size);
    ctx.textAlign = "left";
    ctx.fillStyle = WHITE;
    ctx.fillText(name.text, PAD, 930);

    ctx.fillStyle = LAVENDER;
    monoFont(ctx, 17);
    setSpacing(ctx, 3);
    ctx.textAlign = "left";
    ctx.fillText(coords || "SATELLITE VIEW", PAD, 972);
    ctx.textAlign = "right";
    ctx.fillText(`SOLVED ${solvedDate}`, W - PAD, 972);
    setSpacing(ctx, 0);

    // ── Stat tiles: pieces of the puzzle, snapped into place ─────────────
    const tileY = 1010;
    const tileH = 180;
    const tileW = 310;
    const tiles = [
      { label: "TIME", value: timeText, color: YELLOW },
      { label: "MOVES", value: String(movesText), color: MINT },
      { label: "GLOBAL RANK", value: rankVal, color: CORAL },
    ];
    tiles.forEach((t, i) => {
      const x = PAD + i * (tileW + 15);

      // hard offset shadow: tile thickness
      ctx.fillStyle = shade(t.color, 0.52);
      roundRect(ctx, x + 10, tileY + 14, tileW, tileH, 22);
      ctx.fill();

      ctx.fillStyle = t.color;
      roundRect(ctx, x, tileY, tileW, tileH, 22);
      ctx.fill();

      ctx.fillStyle = "rgba(27, 30, 53, 0.62)";
      monoFont(ctx, 15);
      setSpacing(ctx, 3);
      ctx.textAlign = "left";
      ctx.fillText(t.label, x + 26, tileY + 46);
      setSpacing(ctx, 0);

      ctx.fillStyle = INK;
      displayFont(ctx, 78);
      ctx.textAlign = "left";
      ctx.fillText(t.value, x + 26, tileY + 146);
    });

    // ── Footer: challenge line + site, and the solved mini-grid ──────────
    ctx.fillStyle = LAVENDER;
    monoFont(ctx, 18);
    setSpacing(ctx, 2);
    ctx.textAlign = "left";
    ctx.fillText(`THINK YOU CAN BEAT ${timeText}?`, PAD, 1256);
    setSpacing(ctx, 0);

    ctx.fillStyle = YELLOW;
    displayFont(ctx, 30);
    ctx.textAlign = "left";
    ctx.fillText("geoshuffle.bittu.dev", PAD, 1298);

    // 6×4 mini board: the solved grid as a quiet icon — one calm tone,
    // with the blank slot left hollow (the piece that was never a piece).
    const cell = 22;
    const cGap = 6;
    const gridW = 6 * cell + 5 * cGap;
    const gridX = W - PAD - gridW;
    const gridY = 1198;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const cx = gridX + col * (cell + cGap);
        const cy = gridY + row * (cell + cGap);
        if (row === 3 && col === 5) {
          ctx.strokeStyle = "rgba(167, 174, 200, 0.45)";
          ctx.lineWidth = 2.5;
          roundRect(ctx, cx, cy, cell, cell, 5);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(253, 253, 248, 0.14)";
          roundRect(ctx, cx, cy, cell, cell, 5);
          ctx.fill();
        }
      }
    }
  };

  // Export only after the draw actually ran (fonts may resolve a tick later).
  const finish = () => {
    try {
      draw();
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

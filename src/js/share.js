import { dataURLtoFile } from "./scorecard.js";

export function copyToClipboardFallback(text) {
  const updateBtnVisual = () => {
    const btn = document.getElementById("btn-copy-share");
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `
        <span class="text-lg">✅</span>
        <span class="text-[9px] uppercase opacity-75">Copied!</span>
      `;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 2000);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(updateBtnVisual)
      .catch((err) => {
        console.error("Clipboard API failed, using fallback:", err);
        execCommandCopy(text, updateBtnVisual);
      });
  } else {
    execCommandCopy(text, updateBtnVisual);
  }
}

function execCommandCopy(text, onSuccess) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("execCommand fallback failed:", err);
  }
  document.body.removeChild(textarea);
}

export function buildSharePayload(currentMap, timeText, movesText, rankText) {
  const locationName = [currentMap.region, currentMap.country]
    .filter(Boolean)
    .join(", ");
  const shareUrl = "https://geoshuffle.bittu.dev";
  const mapLink = currentMap.map || "#";

  const shareText = `I solved the GeoShuffle satellite puzzle for ${locationName} in ${timeText} with ${movesText} moves! Global Rank: ${rankText}. Can you beat me?\n\nPlay here: ${shareUrl}\n🗺️ Google Maps Location: ${mapLink}`;
  const shareTextWithImg = `${shareText}\n\nSatellite View: ${currentMap.image}`;

  return { shareText, shareTextWithImg, shareUrl, locationName, mapLink };
}

export function setupSocialShareLinks(
  currentMap,
  timeText,
  movesText,
  rankText,
) {
  const { shareText, shareTextWithImg, shareUrl, locationName, mapLink } =
    buildSharePayload(currentMap, timeText, movesText, rankText);
  const redditTitle = `I solved today's GeoShuffle satellite puzzle in ${timeText}!`;

  const shareTwitter = document.getElementById("share-twitter");
  if (shareTwitter) {
    shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  }

  const shareReddit = document.getElementById("share-reddit");
  if (shareReddit) {
    const redditBody = `I solved today's GeoShuffle satellite puzzle for **${locationName}**!\n\n⏱️ **Time:** ${timeText}\n👣 **Moves:** ${movesText}\n🏆 **Global Rank:** ${rankText}\n\nPlay here: ${shareUrl}\n🗺️ Google Maps Location: ${mapLink}`;
    shareReddit.href = `https://www.reddit.com/submit?title=${encodeURIComponent(redditTitle)}&text=${encodeURIComponent(redditBody)}`;
  }

  const shareFacebook = document.getElementById("share-facebook");
  if (shareFacebook) {
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  }

  const shareTelegram = document.getElementById("share-telegram");
  if (shareTelegram) {
    const telegramText = `${shareText}\n\nSatellite View: ${currentMap.image}`;
    shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`;
  }

  const sharePinterest = document.getElementById("share-pinterest");
  if (sharePinterest) {
    sharePinterest.href = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(currentMap.image)}&description=${encodeURIComponent(shareText)}&title=${encodeURIComponent(redditTitle)}`;
  }

  const copyShareBtn = document.getElementById("btn-copy-share");
  if (copyShareBtn) {
    const newCopyBtn = copyShareBtn.cloneNode(true);
    copyShareBtn.parentNode.replaceChild(newCopyBtn, copyShareBtn);
    newCopyBtn.addEventListener("click", () => {
      copyToClipboardFallback(shareText);
    });
  }
}

export async function triggerNativeShare(
  currentMap,
  timeText,
  movesText,
  rankText,
) {
  const { shareText, shareTextWithImg, shareUrl } = buildSharePayload(
    currentMap,
    timeText,
    movesText,
    rankText,
  );

  const imgEl = document.getElementById("scorecard-preview");
  const dataUrl = imgEl ? imgEl.src : null;

  if (navigator.share) {
    try {
      let shareData = {
        title: "GeoShuffle Solve",
        text: shareText,
        url: shareUrl,
      };

      if (dataUrl && dataUrl.startsWith("data:image")) {
        try {
          const file = dataURLtoFile(dataUrl, "geoshuffle-scorecard.png");
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (fileErr) {
          console.error("Failed to build file for sharing:", fileErr);
        }
      }

      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Share cancelled by user.");
        return;
      }
      console.warn(
        "Native file sharing failed, trying text-only sharing:",
        err,
      );
      try {
        await navigator.share({
          title: "GeoShuffle Solve",
          text: shareTextWithImg,
          url: shareUrl,
        });
        return;
      } catch (fallbackErr) {
        if (fallbackErr.name === "AbortError") return;
        console.error("Native text share failed:", fallbackErr);
      }
    }
  }

  copyToClipboardFallback(shareTextWithImg);
}

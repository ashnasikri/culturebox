export async function generatePlaceholderCover(
  title: string,
  type: "movie" | "book"
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 342;
  canvas.height = 513;
  const ctx = canvas.getContext("2d")!;

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 342, 513);
  if (type === "movie") {
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
  } else {
    gradient.addColorStop(0, "#2d2416");
    gradient.addColorStop(1, "#1a1612");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 342, 513);

  // Subtle border
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 341, 512);

  // Emoji
  const emoji = type === "movie" ? "\uD83C\uDFAC" : "\uD83D\uDCDA";
  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText(emoji, 171, 220);

  // Title text with word wrap
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "600 22px sans-serif";
  ctx.textAlign = "center";

  const words = title.split(" ");
  let line = "";
  let y = 290;
  const maxWidth = 280;
  const lineHeight = 30;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, 171, y);
      line = word;
      y += lineHeight;
      if (y > 440) break;
    } else {
      line = testLine;
    }
  }
  if (line && y <= 440) {
    ctx.fillText(line, 171, y);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

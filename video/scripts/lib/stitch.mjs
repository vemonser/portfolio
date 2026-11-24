import sharp from "sharp";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseColor(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value || "");
  if (!match) return { r: 255, g: 255, b: 255 };
  const [r, g, b] = match[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Math.round(Number(part.trim())));
  return { r: r || 0, g: g || 0, b: b || 0 };
}

async function captureChunks(page, height, viewportHeight, dpr) {
  const maxY = Math.max(0, height - viewportHeight);
  const step = Math.max(1, viewportHeight - 32);
  const positions = [];
  for (let y = 0; y <= maxY; y += step) positions.push(y);
  if (positions[positions.length - 1] !== maxY) positions.push(maxY);

  const chunks = [];
  for (const y of positions) {
    await page.evaluate(
      (value) => window.scrollTo({ top: value, behavior: "instant" }),
      y,
    );
    await sleep(260);
    const actualY = await page.evaluate(() => Math.round(window.scrollY));
    const buffer = await page.screenshot({
      animations: "disabled",
      caret: "hide",
      timeout: 60_000,
    });
    chunks.push({ y: actualY, buffer });
  }
  return chunks;
}

/**
 * One full-page shot is preferable: it is a single consistent frame of the
 * page. Chromium occasionally clips very tall captures, and some sites render
 * differently beyond the viewport, so the result is validated against the DOM
 * height and falls back to viewport chunks stitched with sharp.
 */
/**
 * Mean absolute difference (0-255) between two images, after normalising to
 * 240 px wide RGB. A blank padded region against a real footer scores high.
 */
async function meanDiff(a, b) {
  const left = await sharp(a).removeAlpha().resize({ width: 240 }).raw().toBuffer();
  const right = await sharp(b).removeAlpha().resize({ width: 240 }).raw().toBuffer();
  const length = Math.min(left.length, right.length);
  if (length === 0) return 255;
  let total = 0;
  for (let i = 0; i < length; i += 1) total += Math.abs(left[i] - right[i]);
  return total / length;
}

export async function captureTallPage({
  page,
  height,
  viewportHeight,
  viewportWidth,
  dpr,
}) {
  if (!Number.isFinite(height) || height < 1) {
    throw new Error("Page height is 0 — nothing to capture (canvas or hidden body?)");
  }
  const expectedHeight = Math.round(height * dpr);
  const expectedWidth = Math.round(viewportWidth * dpr);

  // The page is parked at the bottom after priming. This is what the user
  // actually sees there; the full-page bitmap must agree with it.
  const bottomRef = await page
    .screenshot({ animations: "disabled", caret: "hide", timeout: 60_000 })
    .catch(() => null);

  let fullPageError = null;
  try {
    const buffer = await page.screenshot({
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      timeout: 90_000,
    });
    const meta = await sharp(buffer).metadata();
    if (
      meta.width === expectedWidth &&
      Math.abs(meta.height - expectedHeight) <= 4
    ) {
      let bottomDiff = 0;
      if (bottomRef) {
        const sliceHeight = Math.min(
          meta.height,
          Math.round(viewportHeight * dpr),
        );
        const slice = await sharp(buffer)
          .extract({
            left: 0,
            top: meta.height - sliceHeight,
            width: meta.width,
            height: sliceHeight,
          })
          .png()
          .toBuffer();
        bottomDiff = await meanDiff(slice, bottomRef);
      }

      if (bottomDiff <= 12) {
        return {
          buffer,
          mode: "fullpage",
          width: meta.width,
          height: meta.height,
          expectedHeight,
          chunks: 1,
          bottomDiff,
        };
      }
      fullPageError = `fullPage bottom differs from the live viewport (${bottomDiff.toFixed(1)}/255)`;
    } else {
      fullPageError = `fullPage ${meta.width}x${meta.height}, expected ${expectedWidth}x${expectedHeight}`;
    }
  } catch (error) {
    fullPageError = String(error);
  }

  const bodyColor = await page.evaluate(() => {
    const body = getComputedStyle(document.body).backgroundColor;
    const html = getComputedStyle(document.documentElement).backgroundColor;
    return body === "rgba(0, 0, 0, 0)" ? html : body;
  });
  const background = parseColor(bodyColor);

  const chunks = await captureChunks(page, height, viewportHeight, dpr);
  const composites = chunks.map((chunk) => ({
    input: chunk.buffer,
    left: 0,
    top: Math.round(chunk.y * dpr),
  }));

  const buffer = await sharp({
    create: {
      width: expectedWidth,
      height: expectedHeight,
      channels: 3,
      background,
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return {
    buffer,
    mode: "stitched",
    width: expectedWidth,
    height: expectedHeight,
    expectedHeight,
    chunks: chunks.length,
    reason: fullPageError,
  };
}

/**
 * JPEG, not WebP, on purpose: WebP caps at 16383 px per side and a tall page
 * at 1800 px wide can exceed that. 4:4:4 keeps small text from smearing.
 */
export async function writeDerivative(buffer, outPath, targetWidth) {
  const meta = await sharp(buffer).metadata();
  const width = Math.min(meta.width, targetWidth);
  await sharp(buffer)
    .resize({ width, withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(outPath);
  return { width, height: Math.round((meta.height * width) / meta.width) };
}

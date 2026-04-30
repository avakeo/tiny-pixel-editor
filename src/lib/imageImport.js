/**
 * Image import utilities: resize an image to the canvas dimensions,
 * convert to grayscale, then binarize using either a threshold or
 * Floyd-Steinberg error-diffusion dithering.
 */

/**
 * Load a File object as an HTMLImageElement.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Draw an image onto an off-screen canvas, resized to targetCols × targetRows.
 *
 * @param {HTMLImageElement} img
 * @param {number} targetCols  Width of output in pixels
 * @param {number} targetRows  Height of output in pixels
 * @param {'stretch'|'contain'} fit
 *   'stretch' – fill the entire canvas (ignores aspect ratio)
 *   'contain' – scale to fit inside, centred, with black letterboxing
 * @returns {ImageData}  Raw pixel data for the resized image
 */
function renderToImageData(img, targetCols, targetRows, fit) {
  const canvas = document.createElement('canvas');
  canvas.width = targetCols;
  canvas.height = targetRows;
  const ctx = canvas.getContext('2d');

  // Black background (letterbox colour)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetCols, targetRows);

  if (fit === 'contain') {
    const scale = Math.min(targetCols / img.width, targetRows / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (targetCols - drawW) / 2;
    const offsetY = (targetRows - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  } else {
    // stretch
    ctx.drawImage(img, 0, 0, targetCols, targetRows);
  }

  return ctx.getImageData(0, 0, targetCols, targetRows);
}

/**
 * Convert RGBA ImageData to a flat Float32Array of grayscale values [0..255].
 * Uses the luminance formula: Y = 0.299R + 0.587G + 0.114B
 * @param {ImageData} imageData
 * @returns {Float32Array}
 */
function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

/**
 * Simple threshold binarization.
 * @param {Float32Array} gray    Grayscale values [0..255]
 * @param {number}       thresh  Threshold value [0..255]
 * @returns {number[]}  Flat pixel array (0 = OFF, 1 = ON)
 */
function applyThreshold(gray, thresh) {
  const pixels = new Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    pixels[i] = gray[i] >= thresh ? 1 : 0;
  }
  return pixels;
}

/**
 * Floyd-Steinberg error-diffusion dithering.
 * @param {Float32Array} gray  Grayscale values [0..255] (will be cloned)
 * @param {number}       cols
 * @param {number}       rows
 * @returns {number[]}  Flat pixel array (0 = OFF, 1 = ON)
 */
function applyFloydSteinberg(gray, cols, rows) {
  // Work on a mutable copy
  const buf = new Float32Array(gray);
  const pixels = new Array(cols * rows).fill(0);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const old = buf[idx];
      const newVal = old >= 128 ? 255 : 0;
      pixels[idx] = newVal === 255 ? 1 : 0;
      const err = old - newVal;

      // Distribute error to neighbours
      if (x + 1 < cols) buf[idx + 1] += (err * 7) / 16;
      if (y + 1 < rows) {
        if (x > 0) buf[idx + cols - 1] += (err * 3) / 16;
        buf[idx + cols] += (err * 5) / 16;
        if (x + 1 < cols) buf[idx + cols + 1] += (err * 1) / 16;
      }
    }
  }

  return pixels;
}

/**
 * Load, resize, and binarize an image file into a flat pixel array.
 *
 * @param {HTMLImageElement} img        Already-loaded image
 * @param {number}           cols       Target canvas width
 * @param {number}           rows       Target canvas height
 * @param {'stretch'|'contain'} fit     Resize mode
 * @param {'threshold'|'dither'} mode   Binarization mode
 * @param {number}           threshold  Threshold value [0..255] (threshold mode only)
 * @returns {number[]}  Flat pixel array (0 = OFF, 1 = ON)
 */
export function binarizeImage(img, cols, rows, fit, mode, threshold) {
  const imageData = renderToImageData(img, cols, rows, fit);
  const gray = toGrayscale(imageData);

  if (mode === 'dither') {
    return applyFloydSteinberg(gray, cols, rows);
  }
  return applyThreshold(gray, threshold);
}

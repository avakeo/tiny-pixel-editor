/**
 * Canvas drawing engine for the OLED pixel editor.
 * Provides low-level pixel manipulation API and canvas size presets.
 */

/** Supported display size presets */
export const CANVAS_PRESETS = [
  { label: '128 × 64', cols: 128, rows: 64 },
  { label: '128 × 32', cols: 128, rows: 32 },
  { label: '128 × 128', cols: 128, rows: 128 },
];

export const DEFAULT_PRESET = CANVAS_PRESETS[0];

/**
 * Create a flat pixel array (0 = OFF, 1 = ON) for the given dimensions.
 * @param {number} cols
 * @param {number} rows
 * @returns {number[]}
 */
export function createPixelArray(cols, rows) {
  return new Array(cols * rows).fill(0);
}

/**
 * Get the value (0 or 1) of the pixel at (x, y).
 * Returns 0 for any coordinate outside the canvas bounds.
 * @param {number[]} pixels  Flat pixel array
 * @param {number} cols      Canvas width in pixels
 * @param {number} rows      Canvas height in pixels
 * @param {number} x
 * @param {number} y
 * @returns {0|1}
 */
export function getPixel(pixels, cols, rows, x, y) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return 0;
  return pixels[y * cols + x];
}

/**
 * Return a new pixel array with the pixel at (x, y) set to color (0 or 1).
 * Returns the original array unchanged if (x, y) is out of bounds.
 * @param {number[]} pixels  Flat pixel array
 * @param {number} cols      Canvas width in pixels
 * @param {number} rows      Canvas height in pixels
 * @param {number} x
 * @param {number} y
 * @param {0|1} color
 * @returns {number[]}
 */
export function setPixel(pixels, cols, rows, x, y, color) {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return pixels;
  const next = [...pixels];
  next[y * cols + x] = color ? 1 : 0;
  return next;
}

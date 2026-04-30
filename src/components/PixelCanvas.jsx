import { useEffect, useRef } from 'react';
import './PixelCanvas.css';

/** Width/height of each pixel cell in CSS pixels */
const CELL = 6;

/** Default OLED display dimensions (128×64) */
const COLS = 128;
const ROWS = 64;

/** Color for an "on" pixel (neon blue, like a real OLED) */
const PIXEL_ON = '#00bfff';
/** Color for an "off" pixel */
const PIXEL_OFF = '#0d0d0d';
/** Grid line color */
const GRID_COLOR = '#1a1c27';

function drawGrid(ctx, cols, rows, canvasW, canvasH) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvasH);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvasW, y * CELL);
    ctx.stroke();
  }
}

function drawPixels(ctx, pixels, cols, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const on = pixels[row * cols + col];
      ctx.fillStyle = on ? PIXEL_ON : PIXEL_OFF;
      ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
    }
  }
}

export default function PixelCanvas({
  pixels,
  cols = COLS,
  rows = ROWS,
  onPixelChange,
  onStrokeStart,
  tool = 'pen',
}) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  const canvasW = cols * CELL;
  const canvasH = rows * CELL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = PIXEL_OFF;
    ctx.fillRect(0, 0, canvasW, canvasH);
    drawPixels(ctx, pixels, cols, rows);
    drawGrid(ctx, cols, rows, canvasW, canvasH);
  }, [pixels, cols, rows, canvasW, canvasH]);

  function getCellFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
    return { x, y };
  }

  function handlePointerDown(e) {
    isDrawing.current = true;
    onStrokeStart?.();
    const { x, y } = getCellFromEvent(e);
    onPixelChange?.(x, y);
  }

  function handlePointerMove(e) {
    if (!isDrawing.current) return;
    const { x, y } = getCellFromEvent(e);
    onPixelChange?.(x, y);
  }

  function handlePointerUp() {
    isDrawing.current = false;
  }

  const cursorStyle = tool === 'eyedropper' ? 'crosshair' : 'crosshair';

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      className="pixel-canvas"
      style={{ cursor: cursorStyle }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label={`Pixel canvas ${cols}×${rows}`}
      role="img"
    />
  );
}

export { COLS, ROWS };

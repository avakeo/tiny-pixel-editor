import { useEffect, useRef } from 'react';
import './PixelCanvas.css';

/** Width/height of each pixel cell in CSS pixels */
const CELL = 6;

/** OLED display dimensions (128×64) */
const COLS = 128;
const ROWS = 64;

const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

/** Color for an "on" pixel (neon blue, like a real OLED) */
const PIXEL_ON = '#00c3ff';
/** Color for an "off" pixel */
const PIXEL_OFF = '#0d0e14';
/** Grid line color */
const GRID_COLOR = '#1a1c27';

function drawGrid(ctx) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(CANVAS_W, y * CELL);
    ctx.stroke();
  }
}

function drawPixels(ctx, pixels) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const on = pixels[row * COLS + col];
      ctx.fillStyle = on ? PIXEL_ON : PIXEL_OFF;
      ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
    }
  }
}

export default function PixelCanvas({ pixels, onPixelChange }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = PIXEL_OFF;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawPixels(ctx, pixels);
    drawGrid(ctx);
  }, [pixels]);

  function getCellFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
    return { x, y };
  }

  function handlePointerDown(e) {
    isDrawing.current = true;
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

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="pixel-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

export { COLS, ROWS };

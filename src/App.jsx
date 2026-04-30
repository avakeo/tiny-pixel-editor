import { useState, useCallback } from 'react';
import PixelCanvas, { COLS, ROWS } from './components/PixelCanvas';
import { lsGet, lsSet } from './lib/storage';
import './App.css';

const TOTAL_PIXELS = COLS * ROWS;

function loadPixels() {
  const saved = lsGet('frame:0');
  if (Array.isArray(saved) && saved.length === TOTAL_PIXELS) return saved;
  return new Array(TOTAL_PIXELS).fill(0);
}

function App() {
  const [pixels, setPixels] = useState(loadPixels);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'

  const handlePixelChange = useCallback(
    (x, y) => {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
      setPixels((prev) => {
        const next = [...prev];
        next[y * COLS + x] = tool === 'pen' ? 1 : 0;
        lsSet('frame:0', next);
        return next;
      });
    },
    [tool],
  );

  function handleClear() {
    const blank = new Array(TOTAL_PIXELS).fill(0);
    setPixels(blank);
    lsSet('frame:0', blank);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Tiny Pixel Editor</h1>
        <p className="app-subtitle">128 × 64 OLED canvas</p>
      </header>

      <main className="app-main">
        <PixelCanvas pixels={pixels} onPixelChange={handlePixelChange} />
      </main>

      <footer className="app-toolbar">
        <button
          type="button"
          className={`tool-btn${tool === 'pen' ? ' active' : ''}`}
          onClick={() => setTool('pen')}
          aria-pressed={tool === 'pen'}
        >
          ✏️ Pen
        </button>
        <button
          type="button"
          className={`tool-btn${tool === 'eraser' ? ' active' : ''}`}
          onClick={() => setTool('eraser')}
          aria-pressed={tool === 'eraser'}
        >
          🧹 Eraser
        </button>
        <button type="button" className="tool-btn clear-btn" onClick={handleClear}>
          🗑️ Clear
        </button>
      </footer>
    </div>
  );
}

export default App;

import { useState, useCallback } from 'react';
import PixelCanvas from './components/PixelCanvas';
import SidePanel from './components/SidePanel';
import { CANVAS_PRESETS, DEFAULT_PRESET, createPixelArray } from './lib/canvasEngine';
import { lsGet, lsSet } from './lib/storage';
import './App.css';

function loadCanvasSize() {
  const saved = lsGet('canvasSize');
  if (saved) {
    const preset = CANVAS_PRESETS.find((p) => p.cols === saved.cols && p.rows === saved.rows);
    if (preset) return preset;
  }
  return DEFAULT_PRESET;
}

function loadPixels(cols, rows) {
  const total = cols * rows;
  const saved = lsGet('frame:0');
  if (Array.isArray(saved) && saved.length === total) return saved;
  return createPixelArray(cols, rows);
}

function App() {
  const [canvasSize, setCanvasSize] = useState(loadCanvasSize);
  const [pixels, setPixels] = useState(() => loadPixels(canvasSize.cols, canvasSize.rows));
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'

  const { cols, rows } = canvasSize;

  const handlePixelChange = useCallback(
    (x, y) => {
      if (x < 0 || x >= cols || y < 0 || y >= rows) return;
      setPixels((prev) => {
        const next = [...prev];
        next[y * cols + x] = tool === 'pen' ? 1 : 0;
        lsSet('frame:0', next);
        return next;
      });
    },
    [tool, cols, rows],
  );

  function handleClear() {
    const blank = createPixelArray(cols, rows);
    setPixels(blank);
    lsSet('frame:0', blank);
  }

  function handleCanvasSizeChange(preset) {
    const blank = createPixelArray(preset.cols, preset.rows);
    setCanvasSize(preset);
    setPixels(blank);
    lsSet('canvasSize', { cols: preset.cols, rows: preset.rows });
    lsSet('frame:0', blank);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Tiny Pixel Editor</h1>
        <p className="app-subtitle">
          {cols} × {rows} OLED canvas
        </p>
      </header>

      <main className="app-main">
        <div className="app-body">
          <PixelCanvas pixels={pixels} onPixelChange={handlePixelChange} cols={cols} rows={rows} />
          <SidePanel canvasSize={canvasSize} onCanvasSizeChange={handleCanvasSizeChange} />
        </div>
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

import { useState, useCallback, useRef } from 'react';
import PixelCanvas, { COLS as DEFAULT_COLS, ROWS as DEFAULT_ROWS } from './components/PixelCanvas';
import FloatingToolbar from './components/FloatingToolbar';
import SidePanel from './components/SidePanel';
import FrameStrip from './components/FrameStrip';
import { lsGet, lsSet } from './lib/storage';
import './App.css';

function makeBlank(cols, rows) {
  return new Array(cols * rows).fill(0);
}

function loadPixels(cols, rows) {
  const saved = lsGet('frame:0');
  if (Array.isArray(saved) && saved.length === cols * rows) return saved;
  return makeBlank(cols, rows);
}

function floodFill(pixels, startX, startY, fillValue, cols, rows) {
  const idx = startY * cols + startX;
  const targetValue = pixels[idx];
  if (targetValue === fillValue) return pixels;

  const next = [...pixels];
  const stack = [idx];

  while (stack.length > 0) {
    const i = stack.pop();
    if (next[i] !== targetValue) continue;
    next[i] = fillValue;

    const x = i % cols;
    const y = Math.floor(i / cols);
    if (x > 0) stack.push(i - 1);
    if (x < cols - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - cols);
    if (y < rows - 1) stack.push(i + cols);
  }

  return next;
}

function generateExport(pixels, cols, rows, language, format) {
  const bytes = [];
  for (let row = 0; row < rows; row++) {
    for (let byteCol = 0; byteCol < Math.ceil(cols / 8); byteCol++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const col = byteCol * 8 + bit;
        if (col < cols && pixels[row * cols + col]) {
          byte |= 1 << (7 - bit);
        }
      }
      bytes.push(byte);
    }
  }

  const isHex = format === 'Hex';
  const values = bytes.map((b) => (isHex ? `0x${b.toString(16).padStart(2, '0')}` : String(b)));

  if (language === 'MicroPython') {
    return `# ${cols}x${rows} pixel bitmap\ndata = bytearray([\n  ${values.join(', ')}\n])`;
  }
  return `// ${cols}x${rows} pixel bitmap\nconst uint8_t bitmap[] PROGMEM = {\n  ${values.join(', ')}\n};`;
}

export default function App() {
  const [displaySize, setDisplaySize] = useState({ cols: DEFAULT_COLS, rows: DEFAULT_ROWS });
  const { cols, rows } = displaySize;

  const [pixels, setPixels] = useState(() => loadPixels(cols, rows));
  const [tool, setTool] = useState('pen');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [exportLanguage, setExportLanguage] = useState('MicroPython');
  const [exportFormat, setExportFormat] = useState('Hex');

  const pixelsRef = useRef(pixels);
  pixelsRef.current = pixels;

  const [frames] = useState([{ id: 'frame:0' }]);
  const [activeFrame] = useState(0);

  const handleStrokeStart = useCallback(() => {
    const snapshot = [...pixelsRef.current];
    setUndoStack((prev) => [...prev.slice(-49), snapshot]);
    setRedoStack([]);
  }, []);

  const handlePixelChange = useCallback(
    (x, y) => {
      if (x < 0 || x >= cols || y < 0 || y >= rows) return;

      if (tool === 'eyedropper') {
        const value = pixelsRef.current[y * cols + x];
        setTool(value === 1 ? 'pen' : 'eraser');
        return;
      }

      setPixels((prev) => {
        let next;
        if (tool === 'bucket') {
          const fillValue = prev[y * cols + x] === 1 ? 0 : 1;
          next = floodFill(prev, x, y, fillValue, cols, rows);
        } else {
          next = [...prev];
          next[y * cols + x] = tool === 'pen' ? 1 : 0;
        }
        lsSet('frame:0', next);
        return next;
      });
    },
    [tool, cols, rows],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, pixelsRef.current]);
    setPixels(prev);
    lsSet('frame:0', prev);
    setUndoStack((u) => u.slice(0, -1));
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, pixelsRef.current]);
    setPixels(next);
    lsSet('frame:0', next);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack]);

  const handleSizeChange = useCallback(({ cols: newCols, rows: newRows }) => {
    setDisplaySize({ cols: newCols, rows: newRows });
    const blank = makeBlank(newCols, newRows);
    setPixels(blank);
    lsSet('frame:0', blank);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const handleExport = useCallback(() => {
    const code = generateExport(pixels, cols, rows, exportLanguage, exportFormat);
    const ext = exportLanguage === 'MicroPython' ? 'py' : 'cpp';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitmap_${cols}x${rows}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pixels, cols, rows, exportLanguage, exportFormat]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Tiny Pixel Editor</h1>
        <p className="app-subtitle">
          {cols} × {rows} OLED canvas
        </p>
      </header>

      <div className="workspace">
        <FloatingToolbar
          tool={tool}
          onToolChange={setTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
        />

        <main className="canvas-area">
          <PixelCanvas
            pixels={pixels}
            cols={cols}
            rows={rows}
            tool={tool}
            onPixelChange={handlePixelChange}
            onStrokeStart={handleStrokeStart}
          />
        </main>

        <SidePanel
          cols={cols}
          rows={rows}
          onSizeChange={handleSizeChange}
          exportLanguage={exportLanguage}
          onExportLanguageChange={setExportLanguage}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          onExport={handleExport}
        />
      </div>

      <FrameStrip
        frames={frames}
        activeFrame={activeFrame}
        onFrameSelect={() => {}}
        onAddFrame={() => {}}
      />
    </div>
  );
}

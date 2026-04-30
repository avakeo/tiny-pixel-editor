import './FloatingToolbar.css';
import { isMac } from '../lib/platform';

const MOD = isMac() ? '⌘' : 'Ctrl';

const TOOLS = [
  { id: 'pen', icon: '✏️', label: 'Pen' },
  { id: 'eraser', icon: '◻️', label: 'Eraser' },
  { id: 'bucket', icon: '🪣', label: 'Fill Bucket' },
  { id: 'eyedropper', icon: '💧', label: 'Eyedropper' },
];

export default function FloatingToolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  return (
    <div className="floating-toolbar" role="toolbar" aria-label="Drawing tools">
      {TOOLS.map(({ id, icon, label }) => (
        <button
          key={id}
          type="button"
          className={`tool-btn${tool === id ? ' active' : ''}`}
          onClick={() => onToolChange(id)}
          aria-label={label}
          aria-pressed={tool === id}
          title={label}
        >
          {icon}
        </button>
      ))}

      <hr className="toolbar-divider" aria-hidden="true" />

      <button
        type="button"
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title={`Undo (${MOD}+Z)`}
      >
        ↩
      </button>
      <button
        type="button"
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title={`Redo (${MOD}+Shift+Z / ${MOD}+Y)`}
      >
        ↪
      </button>
    </div>
  );
}

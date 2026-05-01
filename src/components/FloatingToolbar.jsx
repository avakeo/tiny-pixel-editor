import './FloatingToolbar.css';
import { isMac } from '../lib/platform';

const MOD = isMac() ? '⌘' : 'Ctrl';

const TOOLS = [
  { id: 'pen', icon: '✏️', label: 'Pen', shortcut: 'P' },
  { id: 'eraser', icon: '◻️', label: 'Eraser', shortcut: 'E' },
  { id: 'bucket', icon: '🪣', label: 'Fill Bucket', shortcut: 'F' },
  { id: 'eyedropper', icon: '💧', label: 'Eyedropper', shortcut: 'I' },
];

export default function FloatingToolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onImport,
}) {
  return (
    <div className="floating-toolbar" role="toolbar" aria-label="Drawing tools">
      {TOOLS.map(({ id, icon, label, shortcut }) => (
        <button
          key={id}
          type="button"
          className={`tool-btn${tool === id ? ' active' : ''}`}
          onClick={() => onToolChange(id)}
          aria-label={label}
          aria-pressed={tool === id}
          title={`${label} (${shortcut})`}
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

      <hr className="toolbar-divider" aria-hidden="true" />

      <button
        type="button"
        className="tool-btn"
        onClick={onImport}
        aria-label="Import image"
        title="Import image"
      >
        🖼️
      </button>
    </div>
  );
}

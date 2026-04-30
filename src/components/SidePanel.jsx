import { CANVAS_PRESETS } from '../lib/canvasEngine';
import './SidePanel.css';

export default function SidePanel({ canvasSize, onCanvasSizeChange }) {
  return (
    <aside className="side-panel">
      <section className="side-section">
        <h2 className="side-section-title">Display Size</h2>
        <div className="size-options">
          {CANVAS_PRESETS.map((preset) => {
            const isActive = canvasSize.cols === preset.cols && canvasSize.rows === preset.rows;
            return (
              <button
                key={`${preset.cols}x${preset.rows}`}
                type="button"
                className={`size-btn${isActive ? ' active' : ''}`}
                onClick={() => onCanvasSizeChange(preset)}
                aria-pressed={isActive}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

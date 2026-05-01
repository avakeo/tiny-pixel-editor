import { useState } from 'react';
import './SidePanel.css';

const DISPLAY_SIZES = [
  { label: '128×64', cols: 128, rows: 64 },
  { label: '128×32', cols: 128, rows: 32 },
  { label: '128×128', cols: 128, rows: 128 },
  { label: '64×64', cols: 64, rows: 64 },
];

const EXPORT_LANGUAGES = ['MicroPython', 'C++'];
const EXPORT_FORMATS = ['Hex', 'Bytearray'];

export default function SidePanel({
  cols,
  rows,
  onSizeChange,
  exportLanguage,
  onExportLanguageChange,
  exportFormat,
  onExportFormatChange,
  onExport,
  onCopy,
}) {
  const [copied, setCopied] = useState(false);

  function handleCopyClick() {
    Promise.resolve(onCopy())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopied(false);
      });
  }
  return (
    <aside className="side-panel" aria-label="Settings panel">
      <section className="panel-section">
        <h2 className="panel-title">Display</h2>
        <div className="size-grid">
          {DISPLAY_SIZES.map((size) => {
            const isActive = cols === size.cols && rows === size.rows;
            return (
              <button
                key={size.label}
                type="button"
                className={`size-btn${isActive ? ' active' : ''}`}
                onClick={() => onSizeChange(size)}
                aria-label={`Set display size to ${size.label}`}
                aria-pressed={isActive}
                title={`${size.label} pixels`}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel-section">
        <h2 className="panel-title">Export</h2>

        <label className="panel-label" htmlFor="export-language">
          Language
        </label>
        <select
          id="export-language"
          className="panel-select"
          value={exportLanguage}
          onChange={(e) => onExportLanguageChange(e.target.value)}
          aria-label="Export language"
        >
          {EXPORT_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <label className="panel-label" htmlFor="export-format">
          Format
        </label>
        <select
          id="export-format"
          className="panel-select"
          value={exportFormat}
          onChange={(e) => onExportFormatChange(e.target.value)}
          aria-label="Export format"
        >
          {EXPORT_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="export-btn"
          onClick={onExport}
          aria-label="Export pixel data"
        >
          ⬇ Export
        </button>
        <button
          type="button"
          className="export-btn copy-btn"
          onClick={handleCopyClick}
          aria-label="Copy pixel data to clipboard"
        >
          {copied ? '✓ Copied!' : '⎘ Copy'}
        </button>
      </section>
    </aside>
  );
}

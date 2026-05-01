import { useRef, useState, useEffect, useCallback } from 'react';
import { loadImageFromFile, binarizeImage } from '../lib/imageImport';
import './ImageImportDialog.css';

const ACCEPT = 'image/png,image/jpeg';

/**
 * Draw a flat 1-bit pixel array onto a <canvas> element.
 */
function renderPreview(canvas, pixels, cols, rows) {
  if (!canvas) return;
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(cols, rows);
  for (let i = 0; i < pixels.length; i++) {
    const on = pixels[i] === 1;
    imageData.data[i * 4] = on ? 0 : 13;
    imageData.data[i * 4 + 1] = on ? 191 : 13;
    imageData.data[i * 4 + 2] = on ? 255 : 13;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

export default function ImageImportDialog({ cols, rows, initialFile, onApply, onClose }) {
  const [img, setImg] = useState(null);
  const [fit, setFit] = useState('contain');
  const [mode, setMode] = useState('threshold');
  const [threshold, setThreshold] = useState(128);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Recompute and render preview whenever any parameter changes
  useEffect(() => {
    if (!img) return;
    const pixels = binarizeImage(img, cols, rows, fit, mode, threshold);
    renderPreview(previewRef.current, pixels, cols, rows);
  }, [img, cols, rows, fit, mode, threshold]);

  // Auto-load file shared via Web Share Target (setState only inside async callbacks)
  useEffect(() => {
    if (!initialFile) return;
    let cancelled = false;
    loadImageFromFile(initialFile)
      .then((loaded) => {
        if (!cancelled) setImg(loaded);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            initialFile.type.startsWith('image/')
              ? 'Failed to load image. Please try another file.'
              : 'Please select a PNG or JPEG image.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [initialFile]);

  const loadFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a PNG or JPEG image.');
      return;
    }
    setError(null);
    loadImageFromFile(file)
      .then((loaded) => setImg(loaded))
      .catch(() => setError('Failed to load image. Please try another file.'));
  }, []);

  function handleFileChange(e) {
    loadFile(e.target.files[0]);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    loadFile(e.dataTransfer.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleApply() {
    if (!img) return;
    const pixels = binarizeImage(img, cols, rows, fit, mode, threshold);
    onApply(pixels);
  }

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="import-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Import image"
      >
        <header className="dialog-header">
          <h2 className="dialog-title">Import Image</h2>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Close import dialog"
          >
            ✕
          </button>
        </header>

        {/* Drop zone */}
        <div
          className={`drop-zone${isDragging ? ' dragging' : ''}${img ? ' has-image' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Drop image here or click to select"
        >
          {img ? (
            <span className="drop-zone-label">Click or drop to replace image</span>
          ) : (
            <>
              <span className="drop-zone-icon">🖼️</span>
              <span className="drop-zone-label">Drop PNG / JPG here</span>
              <span className="drop-zone-sub">or click to select a file</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="visually-hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />

        {error && <p className="import-error" role="alert">{error}</p>}

        {/* Options */}
        <div className="import-options">
          {/* Fit mode */}
          <fieldset className="option-group">
            <legend className="option-legend">Fit</legend>
            <label className="option-radio">
              <input
                type="radio"
                name="fit"
                value="contain"
                checked={fit === 'contain'}
                onChange={() => setFit('contain')}
              />
              Contain
            </label>
            <label className="option-radio">
              <input
                type="radio"
                name="fit"
                value="stretch"
                checked={fit === 'stretch'}
                onChange={() => setFit('stretch')}
              />
              Stretch
            </label>
          </fieldset>

          {/* Binarization mode */}
          <fieldset className="option-group">
            <legend className="option-legend">Binarization</legend>
            <label className="option-radio">
              <input
                type="radio"
                name="mode"
                value="threshold"
                checked={mode === 'threshold'}
                onChange={() => setMode('threshold')}
              />
              Threshold
            </label>
            <label className="option-radio">
              <input
                type="radio"
                name="mode"
                value="dither"
                checked={mode === 'dither'}
                onChange={() => setMode('dither')}
              />
              Dither (Floyd-Steinberg)
            </label>
          </fieldset>
        </div>

        {/* Threshold slider (only in threshold mode) */}
        {mode === 'threshold' && (
          <div className="threshold-row">
            <label className="threshold-label" htmlFor="threshold-slider">
              Threshold
            </label>
            <input
              id="threshold-slider"
              type="range"
              min="0"
              max="255"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="threshold-slider"
              aria-label={`Threshold value: ${threshold}`}
            />
            <span className="threshold-value">{threshold}</span>
          </div>
        )}

        {/* Preview */}
        <div className="preview-area">
          <p className="preview-label">Preview ({cols}×{rows})</p>
          <canvas
            ref={previewRef}
            className="preview-canvas"
            width={cols}
            height={rows}
            aria-label="Binarized image preview"
          />
        </div>

        {/* Actions */}
        <div className="dialog-actions">
          <button type="button" className="action-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="action-btn apply-btn"
            onClick={handleApply}
            disabled={!img}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

import { useRef, useState, useEffect, useCallback } from 'react';
import './CanvasViewport.css';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 16;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * CanvasViewport wraps any content (typically PixelCanvas) and provides:
 * - Mouse-wheel / trackpad-pinch zoom centred on the cursor
 * - Space+drag or middle-button drag to pan
 * - Touch pinch-zoom and 2-finger swipe pan
 * - Ctrl+0 to reset to fit-view
 * - A zoom-level badge
 *
 * Props:
 *   children      – content to display inside the viewport
 *   canvasWidth   – natural (unscaled) pixel width of the content
 *   canvasHeight  – natural (unscaled) pixel height of the content
 */
export default function CanvasViewport({ children, canvasWidth, canvasHeight }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);

  // Refs hold the live values so event callbacks never close over stale state
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  // Display-only state (triggers re-render for badge + cursor)
  const [displayZoom, setDisplayZoom] = useState(1);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const spaceRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartClient = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });

  // Touch state
  const touchRef = useRef({ dist: null, mid: null });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const applyTransform = useCallback(() => {
    if (!contentRef.current) return;
    const { x, y } = panRef.current;
    const z = zoomRef.current;
    contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
  }, []);

  /** Zoom to `newZoom` keeping the viewport point (vpX, vpY) stationary. */
  const zoomAt = useCallback(
    (newZoom, vpX, vpY) => {
      const clamped = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
      const ratio = clamped / zoomRef.current;
      panRef.current = {
        x: vpX - (vpX - panRef.current.x) * ratio,
        y: vpY - (vpY - panRef.current.y) * ratio,
      };
      zoomRef.current = clamped;
      applyTransform();
      setDisplayZoom(clamped);
    },
    [applyTransform],
  );

  /** Scale canvas to fit the viewport, centred. */
  const fitView = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !canvasWidth || !canvasHeight) return;
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const fitZ = clamp(Math.min(vpW / canvasWidth, vpH / canvasHeight), MIN_ZOOM, MAX_ZOOM);
    panRef.current = {
      x: (vpW - canvasWidth * fitZ) / 2,
      y: (vpH - canvasHeight * fitZ) / 2,
    };
    zoomRef.current = fitZ;
    applyTransform();
    setDisplayZoom(fitZ);
  }, [canvasWidth, canvasHeight, applyTransform]);

  // ── Initialise centred whenever canvas size changes ────────────────────

  useEffect(() => {
    fitView();
  }, [fitView]);

  // ── Keyboard: Space (pan mode) + Ctrl+0 (fit view) ────────────────────

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' && !e.repeat) {
        // Don't hijack space inside form controls
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        spaceRef.current = true;
        setSpaceHeld(true);
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        fitView();
      }
    }
    function onKeyUp(e) {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setSpaceHeld(false);
        // Release pan if user lifts space mid-drag
        if (isPanningRef.current) {
          isPanningRef.current = false;
          setIsPanning(false);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [fitView]);

  // ── Wheel zoom (must be non-passive to call preventDefault) ───────────

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e) {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const vpX = e.clientX - rect.left;
      const vpY = e.clientY - rect.top;
      // ctrlKey is set by the browser for trackpad pinch gestures
      const factor = e.ctrlKey
        ? Math.exp(-e.deltaY * 0.015)
        : Math.exp(-e.deltaY * 0.002);
      zoomAt(zoomRef.current * factor, vpX, vpY);
    }
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // ── Touch: pinch zoom + 2-finger pan ──────────────────────────────────

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        touchRef.current = {
          dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
          mid: {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          },
        };
      }
    }

    function onTouchMove(e) {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const mid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      const rect = vp.getBoundingClientRect();
      const vpX = mid.x - rect.left;
      const vpY = mid.y - rect.top;
      const { dist: prevDist, mid: prevMid } = touchRef.current;

      // Pan from midpoint movement first, then apply zoom
      if (prevMid) {
        panRef.current = {
          x: panRef.current.x + (mid.x - prevMid.x),
          y: panRef.current.y + (mid.y - prevMid.y),
        };
      }

      if (prevDist && prevDist > 0) {
        const factor = dist / prevDist;
        const newZoom = clamp(zoomRef.current * factor, MIN_ZOOM, MAX_ZOOM);
        const ratio = newZoom / zoomRef.current;
        panRef.current = {
          x: vpX - (vpX - panRef.current.x) * ratio,
          y: vpY - (vpY - panRef.current.y) * ratio,
        };
        zoomRef.current = newZoom;
        setDisplayZoom(newZoom);
      }

      applyTransform();
      touchRef.current = { dist, mid };
    }

    function onTouchEnd() {
      touchRef.current = { dist: null, mid: null };
    }

    vp.addEventListener('touchstart', onTouchStart, { passive: false });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd);
    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
    };
  }, [applyTransform]);

  // ── Pointer capture-phase handlers for panning ────────────────────────
  //
  // Using capture phase (onPointerDownCapture etc.) means these fire before
  // the canvas element's own handlers.  When pan mode is active we stop
  // propagation so the canvas never sees the event and won't draw.

  function handlePointerDownCapture(e) {
    const isMiddle = e.button === 1;
    const isSpacePan = spaceRef.current && e.button === 0;
    if (!isMiddle && !isSpacePan) return;

    e.stopPropagation();
    e.preventDefault();
    isPanningRef.current = true;
    setIsPanning(true);
    panStartClient.current = { x: e.clientX, y: e.clientY };
    panStartOffset.current = { ...panRef.current };
    // Capture so move/up events keep arriving even when cursor leaves viewport
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMoveCapture(e) {
    if (!isPanningRef.current) return;
    e.stopPropagation();
    panRef.current = {
      x: panStartOffset.current.x + (e.clientX - panStartClient.current.x),
      y: panStartOffset.current.y + (e.clientY - panStartClient.current.y),
    };
    applyTransform();
  }

  function handlePointerUpCapture(e) {
    if (!isPanningRef.current) return;
    e.stopPropagation();
    isPanningRef.current = false;
    setIsPanning(false);
  }

  // ── Render ───────────────────────────────────────────────────────────

  let cursorClass = '';
  if (isPanning) cursorClass = 'canvas-viewport--grabbing';
  else if (spaceHeld) cursorClass = 'canvas-viewport--grab';

  return (
    <div
      ref={viewportRef}
      className={`canvas-viewport${cursorClass ? ` ${cursorClass}` : ''}`}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onPointerCancelCapture={handlePointerUpCapture}
    >
      <div
        ref={contentRef}
        className="canvas-viewport-content"
        style={{ transformOrigin: '0 0' }}
      >
        {children}
      </div>

      <div className="zoom-badge" aria-live="polite" aria-atomic="true">
        {Math.round(displayZoom * 100)}%
      </div>
    </div>
  );
}

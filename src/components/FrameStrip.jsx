import './FrameStrip.css';

export default function FrameStrip({ frames, activeFrame, onFrameSelect, onAddFrame }) {
  return (
    <div className="frame-strip" role="list" aria-label="Animation frames">
      {frames.map((frame, index) => (
        <button
          key={frame.id}
          type="button"
          role="listitem"
          className={`frame-thumb${activeFrame === index ? ' active' : ''}`}
          onClick={() => onFrameSelect(index)}
          aria-label={`Frame ${index + 1}`}
          aria-pressed={activeFrame === index}
          title={`Frame ${index + 1}`}
        >
          <span className="frame-number">{index + 1}</span>
        </button>
      ))}
      <button
        type="button"
        className="frame-add"
        onClick={onAddFrame}
        aria-label="Add frame"
        title="Add frame"
      >
        +
      </button>
    </div>
  );
}

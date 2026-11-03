export function TargetBars({
  top,
  heart,
  base,
  compact = false,
}: {
  top: number;
  heart: number;
  base: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "target-bars target-bars--compact" : "target-bars"}>
      <div className="target-bars__row">
        <span>Top</span>
        <span className="target-bars__track">
          <span className="target-bars__fill target-bars__fill--top" style={{ width: `${top}%` }} />
        </span>
        <span className="mono">{top}%</span>
      </div>
      <div className="target-bars__row">
        <span>Heart</span>
        <span className="target-bars__track">
          <span className="target-bars__fill target-bars__fill--heart" style={{ width: `${heart}%` }} />
        </span>
        <span className="mono">{heart}%</span>
      </div>
      <div className="target-bars__row">
        <span>Base</span>
        <span className="target-bars__track">
          <span className="target-bars__fill target-bars__fill--base" style={{ width: `${base}%` }} />
        </span>
        <span className="mono">{base}%</span>
      </div>
    </div>
  );
}

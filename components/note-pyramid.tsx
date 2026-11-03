interface NotePyramidProps {
  top: number;
  heart: number;
  base: number;
  total?: number;
  compact?: boolean;
  label?: string;
}

const APEX_Y = 12;
const BASE_Y = 178;
const HALF = 100;
const CENTER = 130;

function edgeAt(y: number): number {
  return CENTER + ((y - APEX_Y) / (BASE_Y - APEX_Y)) * HALF;
}

export function NotePyramid({ top, heart, base, total = 1000, compact = false, label }: NotePyramidProps) {
  const safe = (value: number) => Math.max(0, Math.min(100, value));
  const topShare = safe(top);
  const heartShare = safe(heart);
  const baseShare = safe(base);
  const span = BASE_Y - APEX_Y;
  const topEnd = APEX_Y + span * (topShare / 100);
  const heartEnd = topEnd + span * (heartShare / 100);
  const baseEnd = heartEnd + span * (baseShare / 100);

  const topPoints = `${CENTER},${APEX_Y} ${edgeAt(topEnd)},${topEnd} ${CENTER - (edgeAt(topEnd) - CENTER)},${topEnd}`;
  const heartPoints = `${CENTER - (edgeAt(topEnd) - CENTER)},${topEnd} ${edgeAt(topEnd)},${topEnd} ${edgeAt(heartEnd)},${heartEnd} ${CENTER - (edgeAt(heartEnd) - CENTER)},${heartEnd}`;
  const basePoints = `${CENTER - (edgeAt(heartEnd) - CENTER)},${heartEnd} ${edgeAt(heartEnd)},${heartEnd} ${edgeAt(baseEnd)},${baseEnd} ${CENTER - (edgeAt(baseEnd) - CENTER)},${baseEnd}`;

  return (
    <div className={compact ? "pyramid pyramid--compact" : "pyramid"}>
      <svg
        viewBox="0 0 260 200"
        role="img"
        aria-label={`${label ? `${label}. ` : ""}Note pyramid: top ${top.toFixed(1)} percent, heart ${heart.toFixed(1)} percent, base ${base.toFixed(1)} percent.`}
      >
        <polygon
          points={`${CENTER},${APEX_Y} ${CENTER + HALF},${BASE_Y} ${CENTER - HALF},${BASE_Y}`}
          className="pyramid__outline"
        />
        {topShare > 0 && <polygon points={topPoints} className="pyramid__band pyramid__band--top" />}
        {heartShare > 0 && <polygon points={heartPoints} className="pyramid__band pyramid__band--heart" />}
        {baseShare > 0 && <polygon points={basePoints} className="pyramid__band pyramid__band--base" />}
        {total < 1000 && (
          <text x={CENTER} y={BASE_Y + 16} textAnchor="middle" className="pyramid__total">
            {total} / 1000
          </text>
        )}
        {label && !compact && (
          <text x={CENTER} y={APEX_Y - 2} textAnchor="middle" className="pyramid__label">
            {label}
          </text>
        )}
      </svg>
      {!compact && (
        <dl className="pyramid__legend">
          <div>
            <dt>
              <span className="swatch swatch--top" aria-hidden="true" />
              Top
            </dt>
            <dd>{top.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>
              <span className="swatch swatch--heart" aria-hidden="true" />
              Heart
            </dt>
            <dd>{heart.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>
              <span className="swatch swatch--base" aria-hidden="true" />
              Base
            </dt>
            <dd>{base.toFixed(1)}%</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

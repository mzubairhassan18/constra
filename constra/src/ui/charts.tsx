// Zero-dependency SVG charts — SSR-safe on Cloudflare Workers (no DOM lib).

export function BarChart({
  data,
  height = 180,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = 100 / Math.max(1, data.length);
  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * (height - 24));
          const x = i * bw + bw * 0.18;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
              <rect
                x={x}
                y={height - 18 - h}
                width={bw * 0.64}
                height={h}
                rx={2}
                fill={d.color ?? "#1e4278"}
              />
            </g>
          );
        })}
        <line
          x1={0}
          y1={height - 18}
          x2={100}
          y2={height - 18}
          stroke="currentColor"
          strokeOpacity={0.25}
        />
      </svg>
      <div className="mt-1 flex">
        {data.map((d) => (
          <div
            key={d.label}
            className="min-w-0 flex-1 truncate px-1 text-center text-[11px] text-slate-500"
            title={`${d.label}: ${format(d.value)}`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  size = 150,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  format?: (v: number) => string;
}) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  const segments = data.map((d, i) => {
    const start = data.slice(0, i).reduce((n, s) => n + s.value, 0) / total;
    const frac = d.value / total;
    return { ...d, dash: frac * c, off: -start * c + c * 0.25 };
  });
  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        role="img"
        aria-label="Donut chart"
      >
        <circle cx={70} cy={70} r={r} fill="none" strokeWidth={20} stroke="var(--border)" />
        {segments.map((d) => (
          <circle
            key={d.label}
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={20}
            strokeDasharray={`${d.dash} ${c - d.dash}`}
            strokeDashoffset={d.off}
          >
            <title>{`${d.label}: ${format(d.value)}`}</title>
          </circle>
        ))}
        <text
          x={70}
          y={70}
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight={800}
          fontSize={18}
          fill="currentColor"
        >
          {format(total)}
        </text>
      </svg>
      <ul className="flex flex-col gap-1 text-xs">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: d.color }}
            />
            <span className="font-medium">{d.label}</span>
            <span className="text-slate-500">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

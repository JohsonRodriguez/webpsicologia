type BarDatum = { label: string; value: number; color: string };

export function BarChart({
  data,
  height = 170,
  barWidthRatio = 1,
}: {
  data: BarDatum[];
  height?: number;
  barWidthRatio?: number;
}) {
  const width = 480;
  const pad = 28;
  const gap = 14;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slotWidth = (width - pad * 2 - gap * (data.length - 1)) / Math.max(data.length, 1);
  const barWidth = slotWidth * barWidthRatio;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
      {data.map((d, i) => {
        const barHeight = max ? (d.value / max) * (height - 40) : 0;
        const x = pad + i * (slotWidth + gap) + (slotWidth - barWidth) / 2;
        const y = height - 26 - barHeight;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx={4} fill={d.color} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontWeight={700} fontSize={10} fill={d.color}>
              {d.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type DonutDatum = { label: string; value: number; color: string };

export function DonutChart({ data, size = 150 }: { data: DonutDatum[]; size?: number }) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {data.map((d) => {
        const frac = d.value / total;
        const dash = frac * circ;
        const el = (
          <circle
            key={d.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--foreground)">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
        casos
      </text>
    </svg>
  );
}

type LineDatum = { label: string; value: number };

export function LineChart({ data, height = 170 }: { data: LineDatum[]; height?: number }) {
  const width = 480;
  const pad = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - 26 - (d.value / max) * (height - 50),
    ...d,
  }));
  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const pathArea =
    points.length > 0
      ? `${pathLine} L${points[points.length - 1].x},${height - 26} L${points[0].x},${height - 26} Z`
      : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
      {pathArea && <path d={pathArea} fill="var(--primary)" fillOpacity={0.12} />}
      <path d={pathLine} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="var(--primary)" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--primary)">
            {p.value}
          </text>
          <text x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

type HorizontalBarDatum = { label: string; value: number; color?: string };

export function HorizontalBarList({ data }: { data: HorizontalBarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-20 flex-none truncate text-sm text-muted-foreground">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "var(--primary)" }}
            />
          </div>
          <span className="w-6 flex-none text-right text-sm font-bold tabular-nums">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: it.color }} />
          {it.label} — <strong className="tabular-nums text-foreground">{it.value}</strong>
        </span>
      ))}
    </div>
  );
}

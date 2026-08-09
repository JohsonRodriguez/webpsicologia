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
            <rect
              data-chart-anim
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={4}
              fill={d.color}
              style={{
                transformBox: "fill-box",
                transformOrigin: "bottom",
                animation: `chart-grow-y 480ms var(--ease-out) both`,
                animationDelay: `${i * 55}ms`,
              }}
            />
            <text
              data-chart-anim
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontWeight={700}
              fontSize={10}
              fill={d.color}
              style={{ animation: `chart-fade-up 320ms var(--ease-out) both`, animationDelay: `${i * 55 + 300}ms` }}
            >
              {d.value}
            </text>
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
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
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = frac * circ;
        const finalOffset = -offset;
        const el = (
          <circle
            data-chart-anim
            key={d.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={finalOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={
              {
                "--chart-circ": `${circ}px`,
                "--chart-offset": `${finalOffset}px`,
                animation: `chart-donut-draw 700ms var(--ease-in-out) both`,
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          />
        );
        offset += dash;
        return el;
      })}
      <text
        data-chart-anim
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        fontSize={20}
        fontWeight={700}
        fill="var(--foreground)"
        style={{ animation: `chart-fade-up 320ms var(--ease-out) both`, animationDelay: "500ms" }}
      >
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
      {pathArea && (
        <path
          data-chart-anim
          d={pathArea}
          fill="var(--primary)"
          fillOpacity={0.12}
          style={{ animation: "chart-fade-up 500ms var(--ease-out) both", animationDelay: "300ms" }}
        />
      )}
      <path
        data-chart-anim
        d={pathLine}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          animation: "chart-draw 700ms var(--ease-in-out) both",
        }}
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle
            data-chart-anim
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="var(--primary)"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: "chart-pop 320ms var(--ease-out) both",
              animationDelay: `${700 + i * 40}ms`,
            }}
          />
          <text
            data-chart-anim
            x={p.x}
            y={p.y - 8}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="var(--primary)"
            style={{ animation: "chart-fade-up 320ms var(--ease-out) both", animationDelay: `${700 + i * 40}ms` }}
          >
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
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-20 flex-none truncate text-sm text-muted-foreground">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              data-chart-anim
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? "var(--primary)",
                transformOrigin: "left",
                animation: "chart-grow-x 480ms var(--ease-out) both",
                animationDelay: `${i * 55}ms`,
              }}
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

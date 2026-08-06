import { cn } from "@/lib/utils";

type Tone = "info" | "warn" | "good" | "critical" | "primary" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  good: "bg-good-soft text-good",
  critical: "bg-critical-soft text-critical",
  primary: "bg-accent text-accent-foreground",
  muted: "bg-secondary text-muted-foreground",
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        TONE_CLASSES[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

const PRIORIDAD: Record<string, { tone: Tone; label: string }> = {
  baja: { tone: "good", label: "Baja" },
  media: { tone: "warn", label: "Media" },
  alta: { tone: "critical", label: "Alta" },
};

export function PillPrioridad({ prioridad }: { prioridad: string }) {
  const p = PRIORIDAD[prioridad] ?? { tone: "muted", label: prioridad };
  return <Pill tone={p.tone}>{p.label}</Pill>;
}

const ESTADO_INCIDENCIA: Record<string, { tone: Tone; label: string }> = {
  nueva: { tone: "info", label: "Nueva" },
  en_revision: { tone: "warn", label: "En revisión" },
  derivada: { tone: "primary", label: "Derivada a caso" },
  cerrada: { tone: "muted", label: "Cerrada" },
};

export function PillEstadoIncidencia({ estado }: { estado: string }) {
  const e = ESTADO_INCIDENCIA[estado] ?? { tone: "muted", label: estado };
  return <Pill tone={e.tone}>{e.label}</Pill>;
}

const ESTADO_CASO: Record<string, { tone: Tone; label: string }> = {
  abierto: { tone: "info", label: "Abierto" },
  en_atencion: { tone: "warn", label: "En atención" },
  derivado: { tone: "primary", label: "Derivado" },
  cerrado: { tone: "good", label: "Cerrado" },
};

export function PillEstadoCaso({ estado }: { estado: string }) {
  const e = ESTADO_CASO[estado] ?? { tone: "muted", label: estado };
  return <Pill tone={e.tone}>{e.label}</Pill>;
}

const PRIORIDAD_BAR: Record<string, string> = {
  baja: "bg-good",
  media: "bg-warn",
  alta: "bg-critical",
};

export function BarraPrioridad({ prioridad }: { prioridad: string }) {
  return (
    <span
      className={cn("inline-block h-6 w-1.5 rounded-sm", PRIORIDAD_BAR[prioridad] ?? "bg-border")}
    />
  );
}

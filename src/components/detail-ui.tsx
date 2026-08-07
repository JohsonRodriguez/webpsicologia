export function iniciales(nombres: string, apellidos: string) {
  return `${nombres[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
}

export function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-semibold">{children}</span>
      </div>
    </div>
  );
}

export function SeccionCard({
  icon: Icon,
  titulo,
  accion,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-2 text-primary">
          <Icon className="size-4" />
          <h3 className="font-heading text-base font-semibold text-foreground">{titulo}</h3>
        </div>
        {accion}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

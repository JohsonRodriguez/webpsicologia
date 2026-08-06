import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function FiltrosLista({
  action,
  q,
  qPlaceholder = "Buscar por alumno…",
  selects,
  hidden,
}: {
  action: string;
  q?: string;
  qPlaceholder?: string;
  selects: { name: string; value?: string; placeholder: string; options: { value: string; label: string }[] }[];
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2.5 p-4">
      {hidden &&
        Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" name="q" defaultValue={q} placeholder={qPlaceholder} className="pl-8" />
      </div>
      {selects.map((s) => (
        <select
          key={s.name}
          name={s.name}
          defaultValue={s.value ?? ""}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">{s.placeholder}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <button
        type="submit"
        className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-secondary"
      >
        Filtrar
      </button>
    </form>
  );
}

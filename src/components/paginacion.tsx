import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Paginacion({
  page,
  totalPages,
  hrefPagina,
}: {
  page: number;
  totalPages: number;
  hrefPagina: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const linkClass =
    "flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-(--ease-out) hover:bg-secondary";

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefPagina(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(linkClass, page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Link>
        <Link
          href={hrefPagina(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={cn(linkClass, page >= totalPages && "pointer-events-none opacity-40")}
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

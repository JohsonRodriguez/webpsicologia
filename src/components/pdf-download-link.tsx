"use client";

import { Eye, Download } from "lucide-react";

export function PdfDownloadLink({ href }: { href: string }) {
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <a
        href={`${href}?inline=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Eye className="size-3.5" />
        Previsualizar
      </a>
      <a
        href={href}
        className="flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Download className="size-3.5" />
        PDF
      </a>
    </div>
  );
}

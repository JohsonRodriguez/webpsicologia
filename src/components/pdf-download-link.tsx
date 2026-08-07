"use client";

import { Download } from "lucide-react";

export function PdfDownloadLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="flex w-fit items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <Download className="size-3.5" />
      PDF
    </a>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      tabIndex={0}
      role="link"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
      className={cn(
        "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </TableRow>
  );
}

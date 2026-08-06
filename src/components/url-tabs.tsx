import Link from "next/link";
import { cn } from "@/lib/utils";

export function UrlTabs({
  tabs,
  active,
}: {
  tabs: { key: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "-mb-px border-b-2 border-transparent px-1 py-2.5 text-sm font-semibold text-muted-foreground",
            t.key === active && "border-primary text-primary",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AgregarInline({
  placeholder,
  triggerLabel,
  onCreate,
  variant = "chip",
}: {
  placeholder: string;
  triggerLabel: string;
  onCreate: (nombre: string) => Promise<{ error?: string; ok?: boolean }>;
  variant?: "chip" | "row";
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [pending, startTransition] = useTransition();

  function crear() {
    if (!valor.trim()) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await onCreate(valor.trim());
      if (result?.error) {
        toast.error(result.error);
      } else {
        setValor("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "chip"
            ? "inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            : "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        }
      >
        <Plus className="size-3.5" />
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Input
        autoFocus
        value={valor}
        placeholder={placeholder}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") crear();
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-7 w-40 text-sm"
        disabled={pending}
      />
      <Button size="sm" className="h-7 px-2" onClick={crear} disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
      </Button>
    </div>
  );
}

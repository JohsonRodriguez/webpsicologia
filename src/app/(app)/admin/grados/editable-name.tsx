"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EditableName({
  value,
  onSave,
  textClassName,
}: {
  value: string;
  onSave: (nuevoNombre: string) => Promise<{ error?: string; ok?: boolean }>;
  textClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`group flex items-center gap-1.5 text-left ${textClassName ?? ""}`}
      >
        {value}
        <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  function guardar() {
    if (!draft.trim() || draft === value) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await onSave(draft.trim());
      if (result?.error) toast.error(result.error);
      setEditing(false);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-7 max-w-[220px] text-sm"
        disabled={pending}
      />
      <button type="button" onClick={guardar} disabled={pending} className="text-good">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </button>
      <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-muted-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

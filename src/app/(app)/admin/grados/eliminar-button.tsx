"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function EliminarButton({
  onDelete,
  confirmMessage,
  className,
}: {
  onDelete: () => Promise<{ error?: string; ok?: boolean }>;
  confirmMessage: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await onDelete();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`text-muted-foreground hover:text-critical disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, Trash2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { guardarFirmaPsicologo, borrarFirmaPsicologo } from "./actions";

export function FirmaForm({ firmaGuardada }: { firmaGuardada: string | null }) {
  const [redibujando, setRedibujando] = useState(!firmaGuardada);
  const [pending, startTransition] = useTransition();
  const pad = useRef<SignaturePadHandle>(null);

  function guardar() {
    if (pad.current?.isEmpty()) {
      toast.error("Dibuja tu firma antes de guardar.");
      return;
    }
    startTransition(async () => {
      const result = await guardarFirmaPsicologo(pad.current!.toDataURL());
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Firma guardada.");
        setRedibujando(false);
      }
    });
  }

  function borrar() {
    startTransition(async () => {
      const result = await borrarFirmaPsicologo();
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Firma eliminada.");
        setRedibujando(true);
      }
    });
  }

  return (
    <div className="max-w-md rounded-xl border border-border bg-card p-5 shadow-sm">
      {!redibujando && firmaGuardada ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={firmaGuardada} alt="Tu firma guardada" className="h-24 object-contain" />
          </div>
          <div className="flex gap-2 self-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setRedibujando(true)}>
              <PenLine className="size-3.5" />
              Redibujar
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={borrar}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Borrar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <SignaturePad ref={pad} label="Tu firma" />
          <Button type="button" disabled={pending} className="self-end" onClick={guardar}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Guardar firma
          </Button>
        </div>
      )}
    </div>
  );
}

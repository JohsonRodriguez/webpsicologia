"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, Trash2, PenLine, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { guardarFirmaPsicologo, borrarFirmaPsicologo } from "./actions";

export function FirmaForm({ firmaGuardada }: { firmaGuardada: string | null }) {
  const [redibujando, setRedibujando] = useState(!firmaGuardada);
  const [firmaSubida, setFirmaSubida] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pad = useRef<SignaturePadHandle>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (archivo.type !== "image/png") {
      toast.error("Solo se aceptan imágenes PNG.");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setFirmaSubida(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  function guardar() {
    const valor = firmaSubida ?? (pad.current && !pad.current.isEmpty() ? pad.current.toDataURL() : null);
    if (!valor) {
      toast.error("Dibuja tu firma o sube una imagen PNG.");
      return;
    }
    startTransition(async () => {
      const result = await guardarFirmaPsicologo(valor);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Firma guardada.");
        setFirmaSubida(null);
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
          {firmaSubida ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={firmaSubida} alt="Imagen de firma seleccionada" className="h-24 object-contain" />
              </div>
              <button
                type="button"
                onClick={() => setFirmaSubida(null)}
                className="flex items-center gap-1 self-end text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                Quitar imagen
              </button>
            </div>
          ) : (
            <>
              <SignaturePad ref={pad} label="Tu firma" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                o
                <div className="h-px flex-1 bg-border" />
              </div>
              <input ref={inputArchivo} type="file" accept="image/png" className="hidden" onChange={elegirArchivo} />
              <Button type="button" variant="outline" onClick={() => inputArchivo.current?.click()}>
                <Upload className="size-4" />
                Subir imagen PNG
              </Button>
            </>
          )}
          <Button type="button" disabled={pending} className="self-end" onClick={guardar}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Guardar firma
          </Button>
        </div>
      )}
    </div>
  );
}

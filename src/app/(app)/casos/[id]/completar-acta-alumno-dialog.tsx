"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { guardarActaAlumnoAlumno, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

export function CompletarActaAlumnoDialog({
  actaId,
  alumnoNombre,
  declaracionInicial,
  compromisoInicial,
}: {
  actaId: string;
  alumnoNombre: string;
  declaracionInicial: string;
  compromisoInicial: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [declaracion, setDeclaracion] = useState(declaracionInicial);
  const [compromiso, setCompromiso] = useState(compromisoInicial);
  const accion = useMemo(() => guardarActaAlumnoAlumno.bind(null, actaId), [actaId]);
  const [state, formAction, pending] = useActionState(accion, initialState);

  const pad = useRef<SignaturePadHandle>(null);
  const inputFirma = useRef<HTMLInputElement>(null);
  const firmando = useRef(false);

  const ambosLlenos = declaracion.trim().length > 0 && compromiso.trim().length > 0;

  useEffect(() => {
    if (!state.ok) return;
    if (firmando.current) {
      toast.success("Acta firmada.");
      setOpen(false);
    } else {
      toast.success("Avance guardado.");
    }
    router.refresh();
  }, [state, router]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setDeclaracion(declaracionInicial);
          setCompromiso(compromisoInicial);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <UserRound className="size-4" />
            Completar con el alumno
          </Button>
        }
      />
      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 left-0 flex h-[100dvh] max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none"
      >
        <div className="flex flex-none items-center justify-between border-b border-border bg-primary px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">Espacio del alumno</p>
            <h2 className="font-heading text-lg font-bold">{alumnoNombre}</h2>
          </div>
          <DialogClose
            render={
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
            }
          />
        </div>

        <form
          action={formAction}
          onSubmit={(e) => {
            if (!firmando.current) return;
            if (pad.current?.isEmpty()) {
              e.preventDefault();
              toast.error("Falta la firma.");
              return;
            }
            if (inputFirma.current) inputFirma.current.value = pad.current!.toDataURL();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 sm:px-10">
            <div className="flex flex-col gap-1.5">
              <Label className="text-base">Declaración del alumno</Label>
              <Textarea
                name="declaracion_alumno"
                value={declaracion}
                onChange={(e) => setDeclaracion(e.target.value)}
                placeholder="Escribe aquí lo que quieras contar…"
                className="min-h-32 text-base"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-base">Compromiso del alumno</Label>
              <Textarea
                name="acuerdos"
                value={compromiso}
                onChange={(e) => setCompromiso(e.target.value)}
                placeholder="Escribe aquí tu compromiso…"
                className="min-h-32 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Puedes escribir tu declaración ahora y completar el compromiso más tarde.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-base">Firma</Label>
              <div className="relative">
                <div className={!ambosLlenos ? "pointer-events-none opacity-30" : ""}>
                  <SignaturePad ref={pad} label="Firma del alumno" />
                </div>
                {!ambosLlenos && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-card/60 px-4 text-center text-sm font-medium text-muted-foreground">
                    Completa la declaración y el compromiso para poder firmar.
                  </div>
                )}
              </div>
              <input ref={inputFirma} type="hidden" name="firma_alumno" />
              <Input name="firma_alumno_nombre" placeholder="Nombre de quien firma" disabled={!ambosLlenos} />
            </div>

            {state.error && (
              <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
            )}
          </div>

          <div className="flex flex-none flex-col-reverse gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              onClick={() => {
                firmando.current = false;
              }}
            >
              Guardar avance
            </Button>
            <Button
              type="submit"
              disabled={pending || !ambosLlenos}
              onClick={() => {
                firmando.current = true;
              }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Firmar y finalizar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

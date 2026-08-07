"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { guardarActaAlumnoAlumno, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

type Paso = "declaracion" | "compromiso" | "firma";

const PASOS: { id: Paso; numero: number; nombre: string }[] = [
  { id: "declaracion", numero: 1, nombre: "Declaración" },
  { id: "compromiso", numero: 2, nombre: "Compromiso" },
  { id: "firma", numero: 3, nombre: "Firma" },
];

function pasoInicial(declaracion: string, compromiso: string): Paso {
  if (!declaracion.trim()) return "declaracion";
  if (!compromiso.trim()) return "compromiso";
  return "firma";
}

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
  const [paso, setPaso] = useState<Paso>(() => pasoInicial(declaracionInicial, compromisoInicial));
  const [declaracion, setDeclaracion] = useState(declaracionInicial);
  const [compromiso, setCompromiso] = useState(compromisoInicial);
  const accion = useMemo(() => guardarActaAlumnoAlumno.bind(null, actaId), [actaId]);
  const [state, formAction, pending] = useActionState(accion, initialState);

  const pad = useRef<SignaturePadHandle>(null);
  const inputFirma = useRef<HTMLInputElement>(null);
  const modo = useRef<"borrador" | "firmar">("borrador");

  useEffect(() => {
    if (!state.ok) return;
    if (modo.current === "firmar") {
      toast.success("Acta firmada.");
      setOpen(false);
    } else {
      toast.success("Declaración guardada. Podrás continuar con el compromiso más tarde.");
      setOpen(false);
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
          setPaso(pasoInicial(declaracionInicial, compromisoInicial));
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

        <div className="flex flex-none items-center justify-center gap-2 border-b border-border bg-secondary/40 py-2.5">
          {PASOS.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  p.id === paso
                    ? "bg-primary text-white"
                    : p.numero < PASOS.find((x) => x.id === paso)!.numero
                      ? "bg-good-soft text-good"
                      : "bg-card text-muted-foreground"
                }`}
              >
                {p.numero}. {p.nombre}
              </div>
              {i < PASOS.length - 1 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        <form
          action={formAction}
          onSubmit={(e) => {
            if (modo.current !== "firmar") return;
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
            {paso === "declaracion" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-base">Declaración del alumno</Label>
                <Textarea
                  autoFocus
                  name="declaracion_alumno"
                  value={declaracion}
                  onChange={(e) => setDeclaracion(e.target.value)}
                  placeholder="Escribe aquí lo que quieras contar…"
                  className="min-h-64 text-base"
                />
              </div>
            )}
            {paso !== "declaracion" && (
              <input type="hidden" name="declaracion_alumno" value={declaracion} />
            )}

            {paso === "compromiso" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-base">Compromiso del alumno</Label>
                <Textarea
                  autoFocus
                  name="acuerdos"
                  value={compromiso}
                  onChange={(e) => setCompromiso(e.target.value)}
                  placeholder="Escribe aquí tu compromiso…"
                  className="min-h-64 text-base"
                />
              </div>
            )}
            {paso !== "compromiso" && <input type="hidden" name="acuerdos" value={compromiso} />}

            {paso === "firma" && (
              <div className="flex flex-col gap-5">
                <div className="rounded-lg border border-border bg-secondary/40 p-3.5">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Compromiso
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line">{compromiso}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-base">Firma</Label>
                  <SignaturePad ref={pad} label="Firma del alumno" />
                  <input ref={inputFirma} type="hidden" name="firma_alumno" />
                  <Input name="firma_alumno_nombre" placeholder="Nombre de quien firma" />
                </div>
              </div>
            )}

            {state.error && (
              <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
            )}
          </div>

          <div className="flex flex-none flex-col-reverse gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-between">
            <div>
              {paso !== "declaracion" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaso(paso === "firma" ? "compromiso" : "declaracion")}
                >
                  <ArrowLeft className="size-4" />
                  Atrás
                </Button>
              )}
            </div>

            {paso === "declaracion" && (
              <Button
                type="submit"
                disabled={pending || !declaracion.trim()}
                onClick={() => {
                  modo.current = "borrador";
                }}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Guardar borrador
              </Button>
            )}

            {paso === "compromiso" && (
              <Button
                type="button"
                disabled={!compromiso.trim()}
                onClick={() => setPaso("firma")}
              >
                Continuar a la firma
                <ArrowRight className="size-4" />
              </Button>
            )}

            {paso === "firma" && (
              <Button
                type="submit"
                disabled={pending}
                onClick={() => {
                  modo.current = "firmar";
                }}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Firmar y finalizar
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

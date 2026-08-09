"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/simple-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectorPrioridad, EvidenciaDropzone } from "@/components/incidencia-campos";
import { actualizarIncidencia, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

export function EditarIncidenciaDialog({
  incidenciaId,
  motivos,
  valoresIniciales,
}: {
  incidenciaId: string;
  motivos: { id: string; nombre: string }[];
  valoresIniciales: {
    motivoId: string;
    motivoOtro: string;
    prioridad: string;
    descripcion: string;
    acciones: string;
    involucrados: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motivoId, setMotivoId] = useState(valoresIniciales.motivoId);
  const accion = useMemo(() => actualizarIncidencia.bind(null, incidenciaId), [incidenciaId]);
  const [state, formAction, pending] = useActionState(accion, initialState);

  const motivoEsOtro = motivos.find((m) => m.id === motivoId)?.nombre === "Otro";

  useEffect(() => {
    if (state.ok) {
      toast.success("Incidencia actualizada.");
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar incidencia</DialogTitle>
          <DialogDescription>
            Puedes editarla mientras el psicólogo no haya abierto un caso de seguimiento.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex max-h-[65vh] flex-col gap-3.5 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label>Motivo</Label>
            <SimpleSelect
              required
              name="motivo"
              value={motivoId}
              onValueChange={setMotivoId}
              placeholder="Selecciona…"
              options={motivos.map((m) => ({ value: m.id, label: m.nombre }))}
            />
            {motivoEsOtro && (
              <Input
                required
                name="motivo_otro"
                defaultValue={valoresIniciales.motivoOtro}
                placeholder="Especifica el motivo…"
                className="mt-1"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nivel de prioridad</Label>
            <SelectorPrioridad valorInicial={valoresIniciales.prioridad} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descripción</Label>
            <Textarea required name="descripcion" defaultValue={valoresIniciales.descripcion} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Acciones tomadas por el docente</Label>
            <Textarea required name="acciones" defaultValue={valoresIniciales.acciones} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Personas involucradas <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input name="involucrados" defaultValue={valoresIniciales.involucrados} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Agregar evidencia <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <EvidenciaDropzone />
          </div>

          {state.error && (
            <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

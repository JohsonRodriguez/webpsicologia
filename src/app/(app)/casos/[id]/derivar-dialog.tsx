"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { derivarCaso } from "../actions";

export function DerivarDialog({
  casoId,
  psicologoActual,
  psicologos,
}: {
  casoId: string;
  psicologoActual: string;
  psicologos: { id: string; nombre: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <ArrowRight className="size-4" />
            Derivar caso
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Derivar caso</DialogTitle>
          <DialogDescription>
            Actualmente a cargo de <strong>{psicologoActual}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            const nuevo = String(formData.get("nuevo_psicologo") ?? "");
            const motivo = String(formData.get("motivo") ?? "");
            if (!nuevo || !motivo.trim()) {
              toast.error("Completa el nuevo psicólogo y el motivo.");
              return;
            }
            startTransition(async () => {
              const result = await derivarCaso(casoId, nuevo, motivo);
              if (result?.error) toast.error(result.error);
              else {
                toast.success("Caso derivado");
                setOpen(false);
              }
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Nuevo psicólogo responsable</Label>
            <select
              required
              name="nuevo_psicologo"
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Selecciona…</option>
              {psicologos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Motivo de la derivación</Label>
            <Textarea required name="motivo" placeholder="Ej. psicólogo titular no disponible" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Derivar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

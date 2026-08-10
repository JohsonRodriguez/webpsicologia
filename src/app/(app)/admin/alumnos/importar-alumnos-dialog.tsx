"use client";

import { useActionState, useRef, useState } from "react";
import { FileUp, Check, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importarAlumnosExcel, type ResultadoImportacion } from "../actions";

const initialState: ResultadoImportacion = {};

export function ImportarAlumnosDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [state, formAction, pending] = useActionState(importarAlumnosExcel, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      formRef.current?.reset();
      setFileName("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <FileUp className="size-4" />
            Importar Excel
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar alumnos desde Excel</DialogTitle>
          <DialogDescription>
            El archivo debe tener columnas de código, nombres, apellidos, nivel, grado y sección. Los niveles,
            grados y secciones que no existan se crean automáticamente. Los alumnos se matriculan en el año
            académico activo.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-3.5">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/50 px-4 py-8 text-center hover:bg-secondary">
            <FileUp className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName || "Selecciona un archivo .xlsx"}</span>
            <span className="text-xs text-muted-foreground">Excel (.xlsx)</span>
            <input
              type="file"
              name="archivo"
              accept=".xlsx"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>

          {state.error && (
            <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
          )}

          {state.ok && (
            <div className="flex flex-col gap-2 rounded-md bg-good-soft px-3 py-2.5 text-sm text-good">
              <p className="flex items-center gap-1.5 font-semibold">
                <Check className="size-4" />
                {state.creados} alumno(s) nuevo(s), {state.actualizados} actualizado(s), {state.matriculados}{" "}
                matrícula(s) guardadas.
              </p>
              {state.advertencias && state.advertencias.length > 0 && (
                <ul className="flex flex-col gap-1 text-xs text-warn">
                  {state.advertencias.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <TriangleAlert className="mt-0.5 size-3 flex-none" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

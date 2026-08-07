"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, CircleAlert, TriangleAlert, Flame, FileUp, File, Image, X } from "lucide-react";
import { comprimirImagenSiAplica } from "@/lib/comprimir-imagen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstructuraAcademica } from "@/lib/queries";
import { crearIncidencia, type EstadoAccion } from "../actions";

type AlumnoOpcion = { alumnoId: string; seccionId: string; nombre: string; codigo: string };

const initialState: EstadoAccion = {};

const PRIORIDADES = [
  {
    value: "baja",
    label: "Baja",
    hint: "Puede esperar",
    icon: CircleAlert,
    activeClass: "border-good bg-good-soft text-good ring-2 ring-good/30",
  },
  {
    value: "media",
    label: "Media",
    hint: "Requiere atención",
    icon: TriangleAlert,
    activeClass: "border-warn bg-warn-soft text-warn ring-2 ring-warn/30",
  },
  {
    value: "alta",
    label: "Alta",
    hint: "Urgente",
    icon: Flame,
    activeClass: "border-critical bg-critical-soft text-critical ring-2 ring-critical/30",
  },
] as const;

function SelectorPrioridad() {
  const [valor, setValor] = useState("");

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name="prioridad" value={valor} required />
      <div className="grid grid-cols-3 gap-2.5">
        {PRIORIDADES.map(({ value, label, hint, icon: Icon, activeClass }) => {
          const activo = valor === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setValor(value)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                activo ? activeClass : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-sm font-semibold">{label}</span>
              <span className={`text-xs ${activo ? "" : "text-muted-foreground"}`}>{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EvidenciaDropzone() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tamanoOriginal, setTamanoOriginal] = useState<number | null>(null);
  const [sobreZona, setSobreZona] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function asignarArchivo(file: File | undefined) {
    if (!file) return;
    setComprimiendo(true);
    const original = file.size;
    const listo = await comprimirImagenSiAplica(file);
    setComprimiendo(false);
    setTamanoOriginal(listo.size < original ? original : null);
    setArchivo(listo);
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(listo);
      inputRef.current.files = dt.files;
    }
  }

  function limpiar() {
    setArchivo(null);
    setTamanoOriginal(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="evidencia"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => asignarArchivo(e.target.files?.[0])}
      />
      {comprimiendo ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-7 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Comprimiendo imagen…
        </div>
      ) : !archivo ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setSobreZona(true);
          }}
          onDragLeave={() => setSobreZona(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSobreZona(false);
            asignarArchivo(e.dataTransfer.files?.[0]);
          }}
          onClick={(e) => {
            e.preventDefault();
            inputRef.current?.click();
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-7 text-center transition-colors ${
            sobreZona ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:bg-secondary/70"
          }`}
        >
          <FileUp className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">
            Arrastra un archivo aquí o <span className="text-primary">selecciónalo</span>
          </span>
          <span className="text-xs text-muted-foreground">Imagen o PDF</span>
        </label>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5">
          <div className="flex size-9 flex-none items-center justify-center rounded-md bg-primary/10 text-primary">
            {archivo.type.startsWith("image/") ? <Image className="size-4.5" /> : <File className="size-4.5" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{archivo.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatearTamano(archivo.size)}
              {tamanoOriginal && (
                <span className="text-good"> · comprimido desde {formatearTamano(tamanoOriginal)}</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={limpiar}
            className="flex size-7 flex-none items-center justify-center rounded-md text-muted-foreground hover:bg-critical-soft hover:text-critical"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function IncidenciaForm({
  estructura,
  alumnosPorSeccion,
  motivos,
}: {
  estructura: EstructuraAcademica;
  alumnosPorSeccion: AlumnoOpcion[];
  motivos: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearIncidencia, initialState);

  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");

  const grados = useMemo(
    () => estructura.grados.filter((g) => g.nivel_id === nivelId),
    [estructura.grados, nivelId],
  );
  const secciones = useMemo(
    () => estructura.secciones.filter((s) => s.grado_id === gradoId),
    [estructura.secciones, gradoId],
  );
  const alumnos = useMemo(
    () => alumnosPorSeccion.filter((a) => a.seccionId === seccionId),
    [alumnosPorSeccion, seccionId],
  );

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-5 p-5">
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1.5 text-sm font-bold text-primary">Alumno</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nivel</Label>
              <select
                required
                value={nivelId}
                onChange={(e) => {
                  setNivelId(e.target.value);
                  setGradoId("");
                  setSeccionId("");
                }}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Selecciona…</option>
                {estructura.niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Grado</Label>
              <select
                required
                disabled={!nivelId}
                value={gradoId}
                onChange={(e) => {
                  setGradoId(e.target.value);
                  setSeccionId("");
                }}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{nivelId ? "Selecciona…" : "Primero elige nivel"}</option>
                {grados.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sección</Label>
              <select
                required
                disabled={!gradoId}
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{gradoId ? "Selecciona…" : "Primero elige grado"}</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <Label>Alumno</Label>
              <select
                required
                disabled={!seccionId}
                name="alumno"
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{seccionId ? "Selecciona…" : "Primero elige sección"}</option>
                {alumnos.map((a) => (
                  <option key={a.alumnoId} value={a.alumnoId}>
                    {a.nombre} — {a.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Motivo</Label>
            <select
              required
              name="motivo"
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Selecciona…</option>
              {motivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Nivel de prioridad</Label>
            <SelectorPrioridad />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea required name="descripcion" placeholder="Describe qué ocurrió…" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Acciones tomadas por el docente</Label>
            <Textarea required name="acciones" placeholder="¿Qué hiciste al momento del incidente?" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>
              Personas involucradas <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input name="involucrados" placeholder="Otros alumnos, personal, etc." />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>
              Evidencia adjunta <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <EvidenciaDropzone />
          </div>
        </div>

        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push("/incidencias")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Enviar incidencia
        </Button>
      </div>
    </form>
  );
}

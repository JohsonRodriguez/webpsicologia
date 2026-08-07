"use client";

import { useRef, useState } from "react";
import { CircleAlert, TriangleAlert, Flame, FileUp, File, Image, X, Loader2 } from "lucide-react";
import { comprimirImagenSiAplica } from "@/lib/comprimir-imagen";

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

export function SelectorPrioridad({ valorInicial = "" }: { valorInicial?: string }) {
  const [valor, setValor] = useState(valorInicial);

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

export function EvidenciaDropzone({ label }: { label?: string } = {}) {
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
            {label ?? (
              <>
                Arrastra un archivo aquí o <span className="text-primary">selecciónalo</span>
              </>
            )}
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

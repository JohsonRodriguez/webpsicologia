"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { Eraser } from "lucide-react";

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
};

export const SignaturePad = forwardRef<SignaturePadHandle, { label: string }>(function SignaturePad(
  { label },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInkRef = useRef(false);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground") || "#222";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasInkRef.current,
    toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInkRef.current = false;
    },
  }));

  return (
    <div className="rounded-lg border border-dashed border-border bg-secondary p-2.5">
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-md bg-card"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawingRef.current = true;
          hasInkRef.current = true;
          lastRef.current = pos(e);
        }}
        onPointerMove={(e) => {
          if (!drawingRef.current || !lastRef.current) return;
          const p = pos(e);
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.beginPath();
          ctx.moveTo(lastRef.current.x, lastRef.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          lastRef.current = p;
        }}
        onPointerUp={() => {
          drawingRef.current = false;
        }}
        onPointerLeave={() => {
          drawingRef.current = false;
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d")!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasInkRef.current = false;
          }}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Eraser className="size-3.5" />
          Limpiar
        </button>
      </div>
    </div>
  );
});

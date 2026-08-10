"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-lg font-semibold">Ocurrió un error inesperado</h1>
          <p className="text-muted-foreground text-sm">
            El equipo ya fue notificado. Por favor, recarga la página.
          </p>
        </div>
      </body>
    </html>
  );
}

import * as Sentry from "@sentry/nextjs";

// Sin NEXT_PUBLIC_SENTRY_DSN configurado, Sentry.init con enabled:false no
// hace nada: el monitoreo de errores queda apagado en vez de romper el build
// o el arranque del servidor.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      enabled: Boolean(dsn),
      tracesSampleRate: 0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;

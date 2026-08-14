import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Evita que otro package-lock.json ubicado en un directorio padre haga
  // que Turbopack infiera una raíz distinta a la de esta aplicación.
  turbopack: {
    root: process.cwd(),
  },
};

// Sin SENTRY_AUTH_TOKEN (solo se configura en Vercel), el plugin construye
// igual y simplemente omite la subida de source maps — no rompe el build local.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: false,
});

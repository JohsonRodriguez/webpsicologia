// Vitest no aplica el remapeo de condiciones de import de Next.js, así que el
// paquete real "server-only" (que lanza si se importa fuera del bundler de
// Next) rompería cualquier test que toque un módulo con `import "server-only"`.
// vitest.config.ts alias-ea "server-only" a este stub vacío solo para tests.
export {};

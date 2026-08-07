const DIMENSION_MAXIMA = 1920;
const CALIDAD = 0.8;
const UMBRAL_BYTES = 400 * 1024;

export async function comprimirImagenSiAplica(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;
  if (archivo.size <= UMBRAL_BYTES) return archivo;

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, DIMENSION_MAXIMA / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD));
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombreComprimido = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombreComprimido, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

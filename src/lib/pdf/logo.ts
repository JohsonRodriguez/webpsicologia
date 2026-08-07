import fs from "node:fs";
import path from "node:path";

const logoPath = path.join(process.cwd(), "public", "logo-verde.png");

export const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

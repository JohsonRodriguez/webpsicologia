import { Text } from "@react-pdf/renderer";
import { partirDetalleConEnfasis } from "@/lib/resumen-incidencia";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfStyle = any;

export function ParrafoConEnfasis({
  texto,
  style,
  boldStyle,
  italicStyle,
}: {
  texto: string;
  style: PdfStyle;
  boldStyle: PdfStyle;
  italicStyle: PdfStyle;
}) {
  const segmentos = partirDetalleConEnfasis(texto);

  return (
    <Text style={style}>
      {segmentos.map((s, i) => {
        if (s.bold) return <Text key={i} style={boldStyle}>{s.texto}</Text>;
        if (s.italic) return <Text key={i} style={italicStyle}>{s.texto}</Text>;
        return <Text key={i}>{s.texto}</Text>;
      })}
    </Text>
  );
}

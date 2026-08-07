import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { ParrafoConEnfasis } from "./parrafo-enfasis";

// Evita que @react-pdf/renderer corte palabras a la mitad al ajustar el texto.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1a2b23" },
  eyebrow: { fontSize: 8, fontWeight: 700, letterSpacing: 1, color: "#166c52", marginBottom: 4 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#5e6c72", marginBottom: 18 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#5e6c72",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: { flexDirection: "row", gap: 24, marginBottom: 10 },
  field: { flexDirection: "column", gap: 2 },
  fieldLabel: { fontSize: 8, color: "#5e6c72" },
  fieldValue: { fontSize: 10.5 },
  paragraph: { fontSize: 10, lineHeight: 1.5 },
  paragraphBold: { fontFamily: "Helvetica-Bold" },
  paragraphItalic: { fontFamily: "Helvetica-Oblique" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e1e3ea", marginVertical: 12 },
  twoCol: { flexDirection: "row", gap: 20 },
  col: { flex: 1 },
  signaturesRow: { flexDirection: "row", gap: 24, marginTop: 20 },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e3ea",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  signatureImg: { width: 180, height: 65, objectFit: "contain" },
  signatureName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginTop: 6 },
  signatureMeta: { fontSize: 8, color: "#5e6c72", marginTop: 2 },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, fontSize: 7.5, color: "#97a0a8", textAlign: "center" },
});

export type ActaPdfData = {
  alumnoNombre: string;
  alumnoCodigo: string;
  fecha: string;
  hora: string;
  psicologoNombre: string;
  asistentes: string;
  detalle: string;
  acuerdosPsicologo: string;
  compromisosPadre: string;
  firmas: { firmanteTipo: string; firmanteNombre: string; firmaData: string; fechaHora: string }[];
  generadoEl: string;
};

function fmtFecha(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

export function ActaPdfDocument({ data }: { data: ActaPdfData }) {
  const firmaPsicologo = data.firmas.find((f) => f.firmanteTipo === "psicologo");
  const firmaPadre = data.firmas.find((f) => f.firmanteTipo === "padre");

  return (
    <Document title={`Acta de reunión — ${data.alumnoNombre}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>PSICOLOGÍA ESCOLAR · COLEGIO LORD BYRON</Text>
        <Text style={styles.title}>Acta de reunión con padres de familia</Text>
        <Text style={styles.subtitle}>
          {data.alumnoNombre} · {data.alumnoCodigo}
        </Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Fecha</Text>
            <Text style={styles.fieldValue}>{fmtFecha(data.fecha)}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Hora</Text>
            <Text style={styles.fieldValue}>{data.hora}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Psicólogo</Text>
            <Text style={styles.fieldValue}>{data.psicologoNombre}</Text>
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Asistentes</Text>
          <Text style={styles.fieldValue}>{data.asistentes}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de la reunión</Text>
          <ParrafoConEnfasis
            texto={data.detalle}
            style={styles.paragraph}
            boldStyle={styles.paragraphBold}
            italicStyle={styles.paragraphItalic}
          />
        </View>

        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Acuerdos y compromisos del psicólogo</Text>
            <Text style={styles.paragraph}>{data.acuerdosPsicologo}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Compromisos del padre de familia</Text>
            <Text style={styles.paragraph}>{data.compromisosPadre}</Text>
          </View>
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            {firmaPsicologo && <Image src={firmaPsicologo.firmaData} style={styles.signatureImg} />}
            <Text style={styles.signatureName}>{data.psicologoNombre}</Text>
            <Text style={styles.signatureMeta}>
              Psicólogo · {firmaPsicologo ? new Date(firmaPsicologo.fechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "Firma no registrada"}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            {firmaPadre && <Image src={firmaPadre.firmaData} style={styles.signatureImg} />}
            <Text style={styles.signatureName}>{firmaPadre?.firmanteNombre ?? "—"}</Text>
            <Text style={styles.signatureMeta}>
              Padre / madre / apoderado ·{" "}
              {firmaPadre ? new Date(firmaPadre.fechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado el {data.generadoEl} · Firma digital en pantalla, sin certificado digital · Uso interno del área de
          Psicología, Colegio Lord Byron
        </Text>
      </Page>
    </Document>
  );
}

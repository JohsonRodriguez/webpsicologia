import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { ParrafoConEnfasis } from "./parrafo-enfasis";
import { logoDataUrl } from "./logo";

// Evita que @react-pdf/renderer corte palabras a la mitad al ajustar el texto.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1a2b23" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 64, height: 31.5, objectFit: "contain" },
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

export type ActaBienestarPdfData = {
  alumnoNombre: string;
  alumnoCodigo: string;
  fechaHora: string;
  periodo: string;
  modalidad: string;
  coordinadorNombre: string;
  observacionPadre: string;
  observacionCoordinador: string;
  firma: { firmanteNombre: string; firmaData: string; fechaHora: string } | null;
  generadoEl: string;
};

export function ActaBienestarPdfDocument({ data }: { data: ActaBienestarPdfData }) {
  return (
    <Document title={`Acta de bienestar familiar — ${data.alumnoNombre}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>DEPARTAMENTO PSICOPEDAGÓGICO · COLEGIO LORD BYRON</Text>
            <Text style={styles.title}>Acta de reunión de bienestar familiar</Text>
            <Text style={styles.subtitle}>
              {data.alumnoNombre} · {data.alumnoCodigo}
            </Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no soporta alt */}
          <Image src={logoDataUrl} style={styles.logo} />
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Fecha y hora</Text>
            <Text style={styles.fieldValue}>{data.fechaHora}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Periodo</Text>
            <Text style={styles.fieldValue}>{data.periodo}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Modalidad</Text>
            <Text style={styles.fieldValue}>{data.modalidad}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Coordinador</Text>
            <Text style={styles.fieldValue}>{data.coordinadorNombre}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observación del padre de familia</Text>
          <ParrafoConEnfasis
            texto={data.observacionPadre}
            style={styles.paragraph}
            boldStyle={styles.paragraphBold}
            italicStyle={styles.paragraphItalic}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observación del coordinador al cierre</Text>
          <ParrafoConEnfasis
            texto={data.observacionCoordinador}
            style={styles.paragraph}
            boldStyle={styles.paragraphBold}
            italicStyle={styles.paragraphItalic}
          />
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no soporta alt */}
            {data.firma && <Image src={data.firma.firmaData} style={styles.signatureImg} />}
            <Text style={styles.signatureName}>{data.firma?.firmanteNombre ?? "—"}</Text>
            <Text style={styles.signatureMeta}>
              Padre / madre / apoderado ·{" "}
              {data.firma
                ? new Date(data.firma.fechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })
                : "Firma no registrada"}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento generado el {data.generadoEl} · Firma digital en pantalla, sin certificado digital · Uso
          confidencial del coordinador de bienestar familiar, Colegio Lord Byron
        </Text>
      </Page>
    </Document>
  );
}

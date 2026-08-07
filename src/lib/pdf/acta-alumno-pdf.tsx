import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { ParrafoConEnfasis } from "./parrafo-enfasis";
import { logoDataUrl } from "./logo";

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
  row: { flexDirection: "row", gap: 24, marginBottom: 14 },
  field: { flexDirection: "column", gap: 2 },
  fieldLabel: { fontSize: 8, color: "#5e6c72" },
  fieldValue: { fontSize: 10.5 },
  paragraph: { fontSize: 10, lineHeight: 1.5 },
  paragraphBold: { fontFamily: "Helvetica-Bold" },
  paragraphItalic: { fontFamily: "Helvetica-Oblique" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e1e3ea", marginVertical: 12 },
  signatureBox: {
    width: 260,
    borderWidth: 1,
    borderColor: "#e1e3ea",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },
  signatureImg: { width: 200, height: 70, objectFit: "contain" },
  signatureName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginTop: 6 },
  signatureMeta: { fontSize: 8, color: "#5e6c72", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: "#97a0a8",
    textAlign: "center",
  },
});

export type ActaAlumnoPdfData = {
  alumnoNombre: string;
  alumnoCodigo: string;
  fecha: string;
  hora: string;
  psicologoNombre: string;
  detalle: string;
  observaciones: string;
  declaracionAlumno: string;
  acuerdos: string;
  firmaAlumnoNombre: string;
  firmaAlumnoData: string;
  firmaFechaHora: string;
  generadoEl: string;
};

function fmtFecha(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

export function ActaAlumnoPdfDocument({ data }: { data: ActaAlumnoPdfData }) {
  return (
    <Document title={`Acta de sesión — ${data.alumnoNombre}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>DEPARTAMENTO PSICOPEDAGÓGICO · COLEGIO LORD BYRON</Text>
            <Text style={styles.title}>Acta de sesión individual con el alumno</Text>
            <Text style={styles.subtitle}>
              {data.alumnoNombre} · {data.alumnoCodigo}
            </Text>
          </View>
          <Image src={logoDataUrl} style={styles.logo} />
        </View>

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

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo de la sesión</Text>
          <ParrafoConEnfasis
            texto={data.detalle}
            style={styles.paragraph}
            boldStyle={styles.paragraphBold}
            italicStyle={styles.paragraphItalic}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observaciones del psicólogo</Text>
          <Text style={styles.paragraph}>{data.observaciones}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Declaración del alumno</Text>
          <Text style={styles.paragraph}>{data.declaracionAlumno}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compromiso del alumno</Text>
          <Text style={styles.paragraph}>{data.acuerdos}</Text>
        </View>

        <View style={styles.signatureBox}>
          <Image src={data.firmaAlumnoData} style={styles.signatureImg} />
          <Text style={styles.signatureName}>{data.firmaAlumnoNombre}</Text>
          <Text style={styles.signatureMeta}>
            Alumno ·{" "}
            {new Date(data.firmaFechaHora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
          </Text>
        </View>

        <Text style={styles.footer}>
          Documento generado el {data.generadoEl} · Firma digital en pantalla, sin certificado digital · Uso interno
          del área de Psicología, Colegio Lord Byron
        </Text>
      </Page>
    </Document>
  );
}

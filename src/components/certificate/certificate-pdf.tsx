import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register fonts if needed, or use standard fonts. We'll use standard Helvetica for simplicity and reliability.

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    position: 'relative'
  },
  borderWrap: {
    border: '4pt solid #4F46E5', // Primary color
    padding: 20,
    height: '100%',
    width: '100%',
    position: 'relative'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  logo: {
    width: 100,
    height: 100,
    objectFit: 'contain'
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 30
  },
  content: {
    fontSize: 16,
    textAlign: 'center',
    color: '#0F172A',
    lineHeight: 1.5,
    marginBottom: 20
  },
  name: {
    fontSize: 24,
    textAlign: 'center',
    color: '#4F46E5',
    fontWeight: 'bold',
    marginBottom: 20,
    textTransform: 'capitalize'
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 40
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 5
  },
  bold: {
    fontWeight: 'bold',
    color: '#0F172A'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  verificationSection: {
    width: '50%'
  },
  qrCode: {
    width: 60,
    height: 60,
    marginBottom: 5
  },
  verifyText: {
    fontSize: 9,
    color: '#64748B'
  },
  verifyCode: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: 'bold'
  },
  signatureSection: {
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#0F172A',
    marginBottom: 5
  },
  signatureText: {
    fontSize: 10,
    color: '#0F172A'
  }
})

export interface CertificateData {
  studentName: string
  studentDni: string
  examName: string
  score: number | string
  date: string
  verificationCode: string
  verifyUrl: string
  qrDataUrl: string
}

export const CertificateDocument = ({ data }: { data: CertificateData }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderWrap}>
          
          <View style={styles.logoContainer}>
            {/* The logo should be an absolute URL or base64 if generated on the client, but for client-side @react-pdf/renderer, relative paths sometimes work or we need the full URL */}
            <Image src="/logo.png" style={styles.logo} />
          </View>

          <Text style={styles.title}>Certificado de Nivelación</Text>
          <Text style={styles.subtitle}>Institución Educativa Nicolas La Torre</Text>

          <Text style={styles.content}>
            Otorga el presente certificado a:
          </Text>

          <Text style={styles.name}>{data.studentName}</Text>

          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Identificado(a) con DNI: <Text style={styles.bold}>{data.studentDni}</Text></Text>
            <Text style={styles.detailText}>Por haber aprobado satisfactoriamente el examen:</Text>
            <Text style={[styles.detailText, styles.bold, { marginTop: 5, fontSize: 16 }]}>{data.examName}</Text>
            <Text style={[styles.detailText, { marginTop: 10 }]}>Con una calificación de: <Text style={styles.bold}>{data.score}</Text></Text>
            <Text style={styles.detailText}>Fecha de aprobación: <Text style={styles.bold}>{data.date}</Text></Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.verificationSection}>
              {data.qrDataUrl && <Image src={data.qrDataUrl} style={styles.qrCode} />}
              <Text style={styles.verifyText}>Para verificar la autenticidad de este documento ingrese a:</Text>
              <Text style={styles.verifyText}>{data.verifyUrl}</Text>
              <Text style={[styles.verifyText, { marginTop: 2 }]}>Código: <Text style={styles.verifyCode}>{data.verificationCode}</Text></Text>
            </View>

            <View style={styles.signatureSection}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Dirección Académica</Text>
              <Text style={styles.signatureText}>Nicolas La Torre</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  )
}

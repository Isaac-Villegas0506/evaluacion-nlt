"use client"
import { useState, useEffect } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { CertificateDocument, CertificateData } from "./certificate-pdf"
import { Button } from "@/components/ui/button"
import { Award, Loader2 } from "lucide-react"

export function CertificateDownloadButton({ data }: { data: CertificateData }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button className="w-full gap-2 bg-primary-600 text-white opacity-70" disabled>
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando Certificado...
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<CertificateDocument data={data} />}
      fileName={`Certificado_Nivelacion_${data.studentName.replace(/\s+/g, '_')}.pdf`}
      className="w-full"
    >
      {({ blob, url, loading, error }) => (
        <Button 
          className="w-full gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20"
          isLoading={loading}
          disabled={loading || !!error}
        >
          <Award className="w-5 h-5" /> 
          {loading ? 'Generando PDF...' : 'Descargar Certificado PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

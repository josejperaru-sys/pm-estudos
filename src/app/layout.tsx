import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PM Estudos — PMMA',
  description: 'Plataforma oficial de ensino tecnológico da Polícia Militar do Maranhão',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}

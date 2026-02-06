import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OKX P2P Scanner + Journal',
  description: 'P2P USDT/UAH scanner and trading journal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

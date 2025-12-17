import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pipe Supply Co. - Professional Industrial Piping Solutions',
  description: 'Your trusted partner for high-quality pipe supply and industrial equipment. Serving the industrial community since 1985.',
  keywords: 'pipe supply, industrial piping, steel pipes, PVC pipes, copper pipes, custom fabrication',
  authors: [{ name: 'Pipe Supply Co.' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
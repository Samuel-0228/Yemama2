import type { Metadata } from 'next'
import './globals.css'
import { ModeProvider } from '@/components/mode-provider'

export const metadata: Metadata = {
  title: 'yemama - Track Your Health Journey',
  description: 'A compassionate pregnancy and period tracking app for every woman',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background font-sans antialiased">
        <ModeProvider>{children}</ModeProvider>
      </body>
    </html>
  )
}

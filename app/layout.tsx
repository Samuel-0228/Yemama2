import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Noto_Sans_Ethiopic } from 'next/font/google'
import './globals.css'
import { GlobalBackButton } from '@/components/global-back-button'
import { FloatingEmergencyButton } from '@/components/floating-emergency-button'
import { AppointmentReminders } from '@/components/appointment-reminders'
import { I18nProvider } from '@/lib/i18n'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const notoEthiopic = Noto_Sans_Ethiopic({ subsets: ['ethiopic'], variable: '--font-ethiopic', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'yemama - Track Your Health Journey',
  description: 'A compassionate pregnancy and period tracking app for every woman',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${geist.variable} ${notoEthiopic.variable}`}>
      <body className="font-sans antialiased bg-background">
        <I18nProvider>
          <GlobalBackButton />
          {children}
          <FloatingEmergencyButton />
          <AppointmentReminders />
        </I18nProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rev11 — Predict the Starting XI',
  description: 'New England Revolution Starting XI Prediction App. Predict the lineup, earn points, compete in The Fort.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Rev11 — Predict the Starting XI',
    description: 'New England Revolution Starting XI Prediction App',
    images: ['/images/og-default.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rev11 — Predict the Starting XI',
    description: 'New England Revolution Starting XI Prediction App',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}

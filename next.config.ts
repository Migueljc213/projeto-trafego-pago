import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Força HTTPS por 1 ano
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Limita info do referrer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desabilita APIs de browser desnecessárias
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: próprio site + Next.js inline + Meta Pixel + Google Fonts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
              // Estilos: próprio site + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fontes: Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Imagens: qualquer HTTPS + data URIs (para Next/Image)
              "img-src 'self' data: https:",
              // Conexões de rede: próprio site + Meta + OpenAI + Stripe
              "connect-src 'self' https://graph.facebook.com https://api.openai.com https://api.stripe.com https://www.facebook.com",
              // Frames: Stripe Checkout
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // API routes: sem cache, CORS apenas para origem própria
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },

  // Bloqueia informações de versão nos response headers
  poweredByHeader: false,
}

export default nextConfig

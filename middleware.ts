import { withAuth } from 'next-auth/middleware'
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // ── Proteção do Super Admin ──────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      const adminEmail = process.env.ADMIN_EMAIL

      // Deve ter email configurado E o token deve corresponder
      if (!adminEmail || !token?.email || token.email !== adminEmail) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Garante que o usuário está autenticado antes de chegar no middleware acima
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    // Dashboard: todas as sub-rotas protegidas por autenticação
    '/dashboard/:path*',
    // Admin: protegido por email específico (verificado no middleware)
    '/admin/:path*',
  ],
}

import type { NextAuthOptions } from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { exchangeForLongLivedToken } from '@/lib/meta-api'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'placeholder',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'placeholder',
      authorization: {
        params: {
          scope: 'public_profile,ads_management,ads_read,business_management',
        },
      },
    }),
    CredentialsProvider({
      id: 'demo',
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials?.email === 'demo@funnelguard.ai' &&
          credentials?.password === 'demo123'
        ) {
          const user = await prisma.user.findUnique({
            where: { email: 'demo@funnelguard.ai' },
          })
          if (user) return { id: user.id, name: user.name, email: user.email, image: user.image }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Troca token curto por token longo (60 dias) e salva criptografado
      if (account?.provider === 'facebook' && account.access_token) {
        try {
          const { access_token: longLivedToken, expires_in } =
            await exchangeForLongLivedToken(account.access_token)
          const encryptedToken = encrypt(longLivedToken)
          const tokenExpiresAt = new Date(Date.now() + expires_in * 1000)

          // Salva token no JWT para ser processado no dashboard (evita FK race condition)
          // O BusinessManager é criado em app/dashboard/layout.tsx após user estar no banco
        } catch (error) {
          console.error('[Auth] Falha ao trocar token:', error)
          // Não bloqueia o login se a troca falhar
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) token.id = user.id
      if (account?.provider === 'facebook' && account.access_token) {
        token.fbAccessToken = account.access_token
        token.fbProviderAccountId = account.providerAccountId
        token.fbName = user?.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      if (token.fbAccessToken) {
        (session as Record<string, unknown>).fbAccessToken = token.fbAccessToken
        ;(session as Record<string, unknown>).fbProviderAccountId = token.fbProviderAccountId
        ;(session as Record<string, unknown>).fbName = token.fbName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

import type { NextAuthOptions } from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

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
          scope: 'public_profile,ads_management,ads_read,business_management,pages_show_list,pages_read_engagement',
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'facebook' && account.access_token && user.id) {
        try {
          const accessTokenEnc = encrypt(account.access_token)
          const tokenExpiresAt = account.expires_at
            ? new Date(account.expires_at * 1000)
            : null
          const bmName =
            (profile as Record<string, unknown> | undefined)?.name as string | undefined
            ?? user.name
            ?? 'Minha Business Manager'
          const metaBmId = account.providerAccountId

          await prisma.businessManager.upsert({
            where: { metaBmId },
            create: {
              userId: user.id,
              metaBmId,
              name: bmName,
              accessTokenEnc,
              tokenExpiresAt,
            },
            update: {
              accessTokenEnc,
              tokenExpiresAt,
              name: bmName,
            },
          })
        } catch (err) {
          console.error('[auth] Erro ao salvar BusinessManager:', err)
          // Não bloqueia o login em caso de falha
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
        const s = session as unknown as Record<string, unknown>
        s.fbAccessToken = token.fbAccessToken
        s.fbProviderAccountId = token.fbProviderAccountId
        s.fbName = token.fbName
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

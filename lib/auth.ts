import type { NextAuthOptions } from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
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
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,public_profile,ads_management,ads_read,business_management',
        },
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

          // Salva ou atualiza o BusinessManager do usuário com o token longo criptografado
          if (user.id) {
            await prisma.businessManager.upsert({
              where: { metaBmId: account.providerAccountId },
              create: {
                userId: user.id,
                metaBmId: account.providerAccountId,
                name: user.name ?? 'Minha Conta',
                accessTokenEnc: encryptedToken,
                tokenExpiresAt,
              },
              update: {
                accessTokenEnc: encryptedToken,
                tokenExpiresAt,
              },
            })
          }
        } catch (error) {
          console.error('[Auth] Falha ao trocar token:', error)
          // Não bloqueia o login se a troca falhar
        }
      }
      return true
    },
    async session({ session, user }) {
      // Adiciona userId na sessão (nunca inclua tokens aqui!)
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'database',
  },
}

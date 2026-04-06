# FunnelGuard AI

SaaS de automação de tráfego pago para Meta Ads com IA.

---

## ⚡ Rodar Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/login` e clique em **Entrar em Modo Demo**.

---

## 🔑 Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz com:

```env
# Banco de Dados (Neon)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""           # openssl rand -base64 32

# Meta (Facebook) App — aguardando aprovação
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
META_WEBHOOK_VERIFY_TOKEN="" # Qualquer string aleatória

# Criptografia de tokens
TOKEN_ENCRYPTION_KEY=""      # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenAI
OPENAI_API_KEY=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_STARTER=""      # price_xxx do painel Stripe
STRIPE_PRICE_PRO=""
STRIPE_PRICE_AGENCY=""

# Resend (email)
RESEND_API_KEY=""
```

---

## 🗄️ Banco de Dados

```bash
# Rodar migrations
npx prisma migrate dev

# Popular com dados de teste
npm run seed
# Login demo: demo@funnelguard.ai / demo123
```

---

## 🚀 Ações necessárias para produção

### 1. Facebook App
> Aguardando aprovação do Meta. Use login demo enquanto isso.

Quando aprovado:
1. Crie app em [developers.facebook.com](https://developers.facebook.com) → tipo **Business**
2. Adicione **Facebook Login** ao app
3. Em **Valid OAuth Redirect URIs** adicione:
   ```
   https://seudominio.vercel.app/api/auth/callback/facebook
   ```
4. Em **Webhooks** configure:
   - URL: `https://seudominio.vercel.app/api/webhooks/meta`
   - Verify Token: valor de `META_WEBHOOK_VERIFY_TOKEN`
5. Copie `FACEBOOK_CLIENT_ID` e `FACEBOOK_CLIENT_SECRET` para a Vercel

### 2. Stripe
1. Crie conta em [stripe.com](https://stripe.com)
2. Crie 3 produtos recorrentes: Starter (R$197), Pro (R$397), Agency (R$797)
3. Copie os **Price IDs** (`price_xxx`) para `STRIPE_PRICE_*`
4. Configure webhook em **Stripe Dashboard → Webhooks**:
   - URL: `https://seudominio.vercel.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copie o **Webhook Signing Secret** para `STRIPE_WEBHOOK_SECRET`

### 3. OpenAI
1. Crie API Key em [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Adicione créditos (modelos usados: `gpt-4o` e `gpt-4o-mini`)
3. Coloque em `OPENAI_API_KEY`

### 4. Resend
1. Crie conta em [resend.com](https://resend.com)
2. Verifique seu domínio de email
3. Crie API Key → `RESEND_API_KEY`
4. No arquivo `lib/email.ts`, troque `alertas@funnelguard.ai` pelo seu email verificado

### 5. Vercel
- Adicione todas as variáveis acima em **Settings → Environment Variables**
- O `prisma generate` roda automaticamente via `postinstall`

---

## 📁 Estrutura

```
app/
  login/              → Página de login (Facebook + Demo)
  dashboard/
    page.tsx          → Visão geral com dados reais do banco
    auditoria/        → LP Auditor com Playwright
    campanhas/        → Campanhas Meta Ads
    precos/           → Price Intelligence
    configuracoes/    → Perfil + plano Stripe
  api/
    auth/             → NextAuth
    webhooks/meta/    → Webhook Meta Ads
    webhooks/stripe/  → Webhook Stripe
lib/
  auth.ts             → Config NextAuth (Facebook + Demo)
  prisma.ts           → Singleton Prisma + Neon
  meta-api.ts         → Meta Graph API v21
  encryption.ts       → AES-256-GCM para tokens
  stripe.ts           → Stripe + planos
  email.ts            → Templates Resend
  ai/                 → Auto-Pilot, LLM Analysis, retry
  scraping/           → Playwright (price crawler + LP audit)
actions/              → Server Actions
prisma/
  schema.prisma       → Schema completo
  seed.ts             → Dados de teste
```

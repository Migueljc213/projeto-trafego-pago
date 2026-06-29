# FunnelGuard AI — Documento Completo de Produção

> Gerado em 2026-06-29. Atualizar sempre que uma nova integração for adicionada.

---

## O que é o FunnelGuard AI

O FunnelGuard AI é um **software de gestão automatizada de campanhas de tráfego pago** (anúncios pagos no Facebook/Instagram). Ele usa inteligência artificial para tomar decisões que um gestor de tráfego tomaria manualmente — pausar campanhas que estão perdendo dinheiro, escalar as que estão lucrando, detectar problemas no site, monitorar concorrentes e gerar criativos.

### Glossário de Termos de Tráfego Pago

| Termo | O que significa |
|---|---|
| **ROAS** | Return on Ad Spend — retorno sobre o investimento em anúncios. ROAS 3x = para cada R$1 investido, gera R$3 em receita |
| **CPA** | Custo por Aquisição — quanto você paga por cada venda ou lead |
| **CPM** | Custo por Mil Impressões — quanto custa exibir o anúncio 1.000 vezes |
| **CTR** | Click-Through Rate — % de pessoas que veem o anúncio e clicam |
| **Frequência** | Quantas vezes a mesma pessoa viu o anúncio. Acima de 4x começa a gerar fadiga |
| **Ad Set** | Conjunto de Anúncios — define o público-alvo, orçamento e programação |
| **Creative** | O criativo do anúncio — a imagem, vídeo, título e texto |
| **ABO** | Ad Set Budget Optimization — orçamento definido por conjunto de anúncios |
| **CBO** | Campaign Budget Optimization — orçamento definido na campanha (Meta distribui automaticamente) |
| **Stop-Loss** | Parar o investimento quando a campanha está destruindo dinheiro |
| **Escala Horizontal** | Duplicar um conjunto que funciona para expandir o alcance sem mexer no original |
| **Fadiga de Criativo** | Quando o público já viu o anúncio muitas vezes e para de responder |
| **LP** | Landing Page — a página do site para onde o anúncio direciona o cliente |
| **Pixel** | Código da Meta no seu site que rastreia conversões |
| **CAPI** | Conversions API — rastreamento server-side (contorna bloqueadores de anúncio) |
| **Business Manager** | Plataforma da Meta para gerenciar contas de anúncio, páginas e usuários |
| **Lookalike** | Público semelhante — a Meta encontra pessoas parecidas com seus melhores clientes |

---

## O que o sistema faz

### Módulo 1 — Auto-Pilot (Piloto Automático)

O coração do sistema. Roda automaticamente todo dia às 9h avaliando cada campanha ativa.

**Hierarquia de decisões:**

```
1. PAUSE urgente     → CPA 50% acima do limite                   (confiança 88%)
2. PAUSE             → ROAS abaixo do alvo + gasto suficiente     (60–95%)
3. PAUSE             → Frequência > 4x (fadiga de criativo)       (80%)
4. DUPLICATE         → ROAS ≥ 2× alvo E CPA ≤ 70% do limite      (88%) — Escala Horizontal
5. SCALE +25%        → ROAS ≥ 1.5× alvo E CPA dentro do limite   (85%)
6. REDUCE -20%       → CPA entre 100% e 150% do limite            (72%)
7. MONITOR           → Performance boa mas abaixo do limiar       (60%)
8. NO_ACTION         → Tudo estável
```

**Versão Correlacionada** (usa 3 fontes de dados simultaneamente):

| Cenário | Detecta | Ação |
|---|---|---|
| **A** | ROAS caiu + concorrente ≥20% mais barato | Pausa + email |
| **B** | ROAS caiu + checkout com erro crítico | Pausa urgente imediata |
| **C** | Pixel com falha + 0 conversões + cliques normais | Monitora + alerta |
| **D** | ROAS caiu + página lenta | Reduz orçamento 30% |

### Módulo 2 — Price Intelligence

Monitora preços de concorrentes via scraping. Envia alerta preditivo se um concorrente baixar mais de 5% em 24h, antes do ROAS cair.

### Módulo 3 — LP Audit

Verifica a landing page automaticamente detectando: checkout quebrado, pixel sem disparar, página lenta, botão de compra quebrado, problemas em mobile.

### Módulo 4 — Creative Lab

Cola a URL de um produto e gera 5 variações de copy (texto de anúncio) via GPT-4o:
- 3 variações **AIDA** (Atenção → Interesse → Desejo → Ação)
- 2 variações **PAS** (Problema → Agitação → Solução)

### Módulo 5 — Centro de Diagnóstico

Painel com 3 termômetros de saúde (criativo, preço, site) e resumo executivo gerado por GPT-4o explicando a causa raiz em linguagem humana.

### Módulo 6 — Relatório Semanal

Toda segunda-feira às 9h: KPIs, dinheiro economizado pela IA, top campanhas, decisões da semana — enviado por email.

### Módulo 7 — Criar Campanha

Cria uma campanha completa no Meta em um formulário único (nome, objetivo, orçamento, criativo, público-alvo).

---

## FunnelGuard vs Madgicx

| Funcionalidade | Madgicx | FunnelGuard |
|---|---|---|
| Otimização automática de orçamento | ✅ | ✅ |
| Pausa automática por performance | ✅ | ✅ |
| Escala automática | ✅ | ✅ |
| Duplicação de ad sets vencedores (Escala Horizontal) | ❌ | ✅ |
| Monitor de preços de concorrentes | ❌ | ✅ |
| Alerta preditivo de queda de preço | ❌ | ✅ |
| Auditoria automática de Landing Page | ❌ | ✅ |
| Diagnóstico de causa raiz com IA | ❌ | ✅ |
| Correlação ROAS + preço + site | ❌ | ✅ |
| Gerador de criativos com IA | ✅ (add-on) | ✅ |
| Relatório semanal automático | ✅ | ✅ |
| CAPI server-side tracking | ✅ ($49/conta extra) | ✅ (incluso) |
| Lookalike Audiences | ✅ | ❌ |
| Google Ads | ❌ | 🟡 parcial |

**Madgicx:** US$49–US$499/mês + US$49/conta para CAPI  
**FunnelGuard:** R$197–R$397/mês com CAPI incluso

---

## Guia de Produção — Passo a Passo

### Pré-requisitos

```bash
node --version   # ≥ 18
npm --version    # ≥ 9
```

---

### Fase 1 — Banco de Dados (Neon PostgreSQL)

1. Acesse [neon.tech](https://neon.tech) → New Project → nome: `funnelguard`
2. Copie a Connection String
3. Configure: `DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"`
4. Aplique as migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

### Fase 2 — Meta App (planeje 2–6 semanas para aprovação)

**2.1 Criar o App**
- [developers.facebook.com](https://developers.facebook.com) → Create App → **Business**
- Anote App ID e App Secret (Settings → Basic)

**2.2 Configurar OAuth**
- Add Product → Facebook Login
- Valid OAuth Redirect URIs: `https://seudominio.com.br/api/auth/callback/facebook`

**2.3 Permissões necessárias**

| Permissão | Tipo de acesso |
|---|---|
| `public_profile` | Standard (sem revisão) |
| `pages_show_list` | Standard |
| `pages_read_engagement` | Standard |
| `ads_read` | Advanced (App Review) |
| `ads_management` | Advanced (App Review) |
| `business_management` | Advanced (App Review) |

**Para o App Review você precisará de:**
- Screencasts do fluxo de login e uso de cada permissão
- Política de Privacidade pública em HTTPS (`/privacy-policy` ✅ já existe)
- Termos de Uso (`/terms-of-service` ✅ já existe)
- URL de Data Deletion (`/data-deletion` ✅ já existe)
- Business Verification (CNPJ/documentos)

**2.4 Configurar Webhook**
- App → Add Product → Webhooks → Object: `Ad Account`
- Callback URL: `https://seudominio.com.br/api/webhooks/meta`
- Verify Token: valor de `META_WEBHOOK_VERIFY_TOKEN`
- Campos: `campaign_status`, `with_issues_ad_objects`, `creative_fatigue`, `in_process_ad_objects`

**2.5 Ativar o app para produção**
- App → App Mode → **Live** (só após aprovação das permissões avançadas)

**2.6 System User Token para CAPI**
- Business Settings → System Users → Add → Role: Employee
- Add Assets → Pixel → Manage
- Generate Token com: `ads_management`, `ads_read`
- **Rotacione a cada 50 dias** — coloque um lembrete no calendário!

**Variáveis desta fase:**
```
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
META_APP_SECRET=           # mesmo valor do CLIENT_SECRET
META_WEBHOOK_VERIFY_TOKEN=
META_PIXEL_ID=
NEXT_PUBLIC_META_PIXEL_ID=
META_SYSTEM_USER_TOKEN=
```

---

### Fase 3 — Stripe (Pagamentos)

1. [stripe.com](https://stripe.com) → Products → Add Product

   **Produto 1 — Starter:** R$197/mês, recorrente  
   **Produto 2 — Pro:** R$397/mês, recorrente

2. Webhook: Stripe → Developers → Webhooks → Add Endpoint
   - URL: `https://seudominio.com.br/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

3. Settings → Billing → **Customer Portal → Activate**

**Variáveis:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PRO=
```

---

### Fase 4 — OpenAI

- [platform.openai.com](https://platform.openai.com) → API Keys → Create
- Adicione créditos e configure spending limit mensal

```
OPENAI_API_KEY=
```

---

### Fase 5 — Resend (E-mails)

1. [resend.com](https://resend.com) → Domains → Add Domain
2. Adicione os registros DNS (MX, DKIM, SPF)
3. Configure o remetente:

```
RESEND_API_KEY=
RESEND_FROM_EMAIL="FunnelGuard AI <noreply@seudominio.com.br>"
```

---

### Fase 6 — Upstash QStash (Filas)

- [console.upstash.com](https://console.upstash.com) → QStash → Create Token

```
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

---

### Fase 7 — Vercel (Deploy)

```bash
npm install -g vercel
vercel --prod
```

- Settings → Environment Variables → adicione todas as vars do `.env.example`
- Plano **Pro** obrigatório para os crons funcionarem

**Gerar chaves de segurança:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# TOKEN_ENCRYPTION_KEY (NUNCA troque em produção — invalida todos os tokens salvos)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET
openssl rand -hex 32
```

**Variáveis gerais:**
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://seudominio.com.br
CRON_SECRET=
TOKEN_ENCRYPTION_KEY=
ADMIN_EMAIL=
NEXT_PUBLIC_ADMIN_EMAIL=
```

---

### Fase 8 — Checklist Final

**Código:**
- [ ] `npx tsc --noEmit` → zero erros
- [ ] `npx prisma migrate deploy` executado no banco de produção
- [ ] `NEXTAUTH_URL` aponta para domínio real (sem `/` no final)
- [ ] `RESEND_FROM_EMAIL` com domínio verificado

**Meta:**
- [ ] App em **Live Mode**
- [ ] App Review aprovado para `ads_management` e `business_management`
- [ ] Webhook registrado e verificado
- [ ] System User Token copiado + lembrete de rotação em 50 dias

**Stripe:**
- [ ] Billing Portal ativado
- [ ] Webhook com os 3 eventos registrado
- [ ] Plano Vercel Pro ativo

**Segurança:**
- [ ] `.env.local` não está no repositório (`.gitignore` ✅)
- [ ] `DEMO_EMAIL`/`DEMO_PASSWORD` vazios em produção
- [ ] `TOKEN_ENCRYPTION_KEY` guardada em local seguro

---

## Rate Limits da Meta API

| Operação | Custo | Quota (Standard Access) |
|---|---|---|
| Leitura (GET) | 1 ponto | 9.000 pts / 5 min |
| Escrita (POST/PUT) | 3 pontos | 9.000 pts / 5 min |
| Insights com breakdowns | 2–5 pontos | mesmo pool |

O sistema já tem retry automático com backoff. Após aprovação do App Review avançado você passa para Full Access (15.000+ pts/min).

---

## Roadmap

| Feature | Prioridade | Esforço | Status |
|---|---|---|---|
| Lookalike Audiences | Alta | Médio | ❌ não iniciado |
| Rate limiter distribuído (Upstash Redis) | Alta | Baixo | ❌ não iniciado |
| Lead Forms (objetivo LEAD_GENERATION) | Média | Alto | ❌ não iniciado |
| Rotação automática do System User Token | Média | Baixo | ❌ não iniciado |
| Google Ads completo | Baixa | Alto | 🟡 parcial |
| Relatórios white-label para agências | Baixa | Médio | ❌ não iniciado |

---

## Correções aplicadas

| Arquivo | Correção |
|---|---|
| `app/api/notifications/route.ts` | `DUPLICATE` adicionado ao mapa de tipos |
| `lib/meta-api.ts` | `subscribeAdAccountToWebhook()` — subscrição obrigatória por ad account |
| `app/api/sync/meta/route.ts` | Subscrição automática ao sincronizar ad accounts |
| `lib/email.ts` | Remetente configurável via `RESEND_FROM_EMAIL` |
| `app/api/webhooks/meta/route.ts` | Handlers para `creative_fatigue` e `with_issues_ad_objects` |
| `.env.example` | 8 variáveis faltantes adicionadas + documentação completa |
| `prisma/schema.prisma` + migration | `DUPLICATE` no enum `DecisionType` |
| `lib/ai/auto-pilot.ts` | `evaluateDuplication()` + Escala Horizontal |
| `actions/auto-pilot.ts` | Execução da Escala Horizontal na Meta API |
| `lib/ai/decision-logger.ts` | `DUPLICATE` no mapper local |

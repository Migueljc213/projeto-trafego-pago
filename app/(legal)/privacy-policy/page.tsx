import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | FunnelGuard AI',
  description: 'Política de Privacidade e tratamento de dados do FunnelGuard AI, em conformidade com a LGPD.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3 border-l-2 border-neon-cyan pl-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  const lastUpdated = '10 de Abril de 2026'

  return (
    <article>
      <div className="mb-10">
        <p className="text-xs font-semibold text-neon-cyan uppercase tracking-wider mb-2">Documento Legal</p>
        <h1 className="text-3xl font-extrabold text-white mb-3">Política de Privacidade</h1>
        <p className="text-sm text-gray-500">
          Última atualização: <strong className="text-gray-300">{lastUpdated}</strong>
        </p>
      </div>

      <Section title="1. Introdução e Identificação do Controlador">
        <p>
          O <strong className="text-gray-200">FunnelGuard AI</strong> ("Plataforma", "nós") é operado por
          [Razão Social — a definir], com CNPJ a definir, com sede no Brasil. Esta Política de Privacidade
          descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade
          com a <strong className="text-gray-200">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>,
          o <strong className="text-gray-200">Regulamento Geral de Proteção de Dados da UE (GDPR)</strong> e as
          políticas da <strong className="text-gray-200">Meta Platforms, Inc.</strong>
        </p>
        <p>
          Ao utilizar a Plataforma, você concorda com os termos desta Política. Caso não concorde, por favor,
          interrompa o uso imediatamente.
        </p>
      </Section>

      <Section title="2. Dados Coletados">
        <p>Coletamos as seguintes categorias de dados:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-gray-200">Dados de cadastro:</strong> nome, endereço de e-mail, foto de perfil
            (fornecidos via login com o Facebook/Meta ou diretamente).
          </li>
          <li>
            <strong className="text-gray-200">Tokens de acesso Meta:</strong> tokens OAuth da Meta Ads API
            (ads_management, ads_read, business_management), armazenados de forma criptografada
            (AES-256-GCM) em repouso. Nunca são transmitidos a terceiros.
          </li>
          <li>
            <strong className="text-gray-200">Dados de campanhas publicitárias:</strong> métricas de desempenho
            (ROAS, CPM, CTR, gastos, conversões) das suas contas de anúncio da Meta.
          </li>
          <li>
            <strong className="text-gray-200">Dados de navegação do usuário final:</strong> através da
            Conversions API (CAPI), podemos receber eventos de conversão (compras, leads) de forma
            anonimizada e hash-ificada (SHA-256) para envio à Meta.
          </li>
          <li>
            <strong className="text-gray-200">Dados de preços de concorrentes:</strong> preços públicos
            coletados por scraping automatizado em sites indicados pelo usuário.
          </li>
          <li>
            <strong className="text-gray-200">Logs de atividade da IA:</strong> registros das decisões
            tomadas automaticamente pelo Auto-Pilot (pausar, escalar, reduzir orçamento) para fins de
            auditoria e transparência.
          </li>
          <li>
            <strong className="text-gray-200">Dados de pagamento:</strong> processados exclusivamente pelo
            <strong className="text-gray-200"> Stripe</strong>. Não armazenamos dados de cartão de crédito.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalidade e Base Legal do Tratamento (LGPD)">
        <p>Os dados são tratados com as seguintes finalidades e bases legais:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-gray-200">Execução do contrato (Art. 7º, V):</strong> autenticação, gerenciamento de campanhas e execução do Auto-Pilot.</li>
          <li><strong className="text-gray-200">Legítimo interesse (Art. 7º, IX):</strong> segurança da plataforma, prevenção de fraudes e melhoria dos modelos de IA.</li>
          <li><strong className="text-gray-200">Consentimento (Art. 7º, I):</strong> envio de relatórios semanais e comunicações de marketing.</li>
          <li><strong className="text-gray-200">Cumprimento de obrigação legal (Art. 7º, II):</strong> retenção de logs para conformidade com auditores e reguladores.</li>
        </ul>
      </Section>

      <Section title="4. Uso de Dados da Meta Ads API">
        <p>
          O FunnelGuard AI utiliza a <strong className="text-gray-200">Meta Marketing API</strong> para
          acessar, em nome do usuário, dados de campanhas publicitárias. O acesso é autorizado pelo
          próprio usuário via OAuth e limitado às permissões explicitamente concedidas.
        </p>
        <p>
          Não utilizamos dados obtidos da API da Meta para criar perfis de usuários, vender dados a terceiros,
          ou para qualquer finalidade não relacionada à prestação do serviço descrito nesta Plataforma.
        </p>
        <p>
          O acesso aos dados da Meta é regido pelos{' '}
          <strong className="text-gray-200">Termos de Plataforma da Meta</strong> e pela nossa política de
          uso aceitável. Os tokens de acesso são revogáveis a qualquer momento pelo usuário diretamente
          no painel da Meta (Business Manager → Configurações → Integrações).
        </p>
      </Section>

      <Section title="5. Compartilhamento de Dados">
        <p>Não vendemos seus dados pessoais. Compartilhamos dados apenas com:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-gray-200">Meta Platforms:</strong> envio de eventos de conversão (CAPI) e gerenciamento de campanhas, conforme autorizado pelo usuário.</li>
          <li><strong className="text-gray-200">OpenAI:</strong> textos de landing pages e briefings de produto para geração de copies (sem dados pessoais identificáveis do usuário final).</li>
          <li><strong className="text-gray-200">Stripe:</strong> processamento de pagamentos.</li>
          <li><strong className="text-gray-200">Resend:</strong> envio de e-mails transacionais (alertas, relatórios).</li>
          <li><strong className="text-gray-200">Neon (PostgreSQL):</strong> banco de dados hospedado com criptografia em repouso e em trânsito.</li>
          <li><strong className="text-gray-200">Vercel:</strong> hospedagem da aplicação, com logs de acesso retidos por 30 dias.</li>
        </ul>
      </Section>

      <Section title="6. Retenção de Dados">
        <p>
          Os dados são retidos pelo período necessário à prestação do serviço ou pelo prazo legal aplicável:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Dados de conta: enquanto a conta estiver ativa.</li>
          <li>Tokens de acesso: até revogação pelo usuário ou expiração natural.</li>
          <li>Logs de decisões da IA: 24 meses, para fins de auditoria.</li>
          <li>Dados de métricas de campanhas: 12 meses.</li>
          <li>Após encerramento da conta: até 90 dias para backup, depois exclusão definitiva.</li>
        </ul>
      </Section>

      <Section title="7. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
          criptografia AES-256-GCM para tokens em repouso, TLS 1.3 para dados em trânsito,
          controle de acesso baseado em função (RBAC), e auditoria de acessos ao banco de dados.
        </p>
      </Section>

      <Section title="8. Seus Direitos (LGPD — Art. 18)">
        <p>Você tem direito a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirmação da existência de tratamento dos seus dados;</li>
          <li>Acesso aos dados tratados;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade dos dados;</li>
          <li>Eliminação dos dados tratados com base no consentimento;</li>
          <li>Revogação do consentimento a qualquer tempo;</li>
          <li>Oposição a tratamento com violação à LGPD.</li>
        </ul>
        <p>
          Para exercer seus direitos, envie e-mail para{' '}
          <strong className="text-gray-200">privacidade@funnelguard.ai</strong> ou utilize nossa{' '}
          <a href="/data-deletion" className="text-neon-cyan hover:underline">página de exclusão de dados</a>.
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          Utilizamos apenas cookies estritamente necessários para autenticação (session token, CSRF).
          Não utilizamos cookies de rastreamento ou analytics de terceiros.
        </p>
      </Section>

      <Section title="10. Contato e DPO">
        <p>
          Encarregado de Dados (DPO): <strong className="text-gray-200">privacidade@funnelguard.ai</strong>
          <br />
          Para reclamações perante a autoridade reguladora, acesse:{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
            www.gov.br/anpd
          </a>
        </p>
      </Section>
    </article>
  )
}

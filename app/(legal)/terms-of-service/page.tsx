import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço | FunnelGuard AI',
  description: 'Termos e Condições de Uso do FunnelGuard AI.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3 border-l-2 border-neon-purple pl-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermsOfServicePage() {
  const lastUpdated = '10 de Abril de 2026'

  return (
    <article>
      <div className="mb-10">
        <p className="text-xs font-semibold text-neon-purple uppercase tracking-wider mb-2">Documento Legal</p>
        <h1 className="text-3xl font-extrabold text-white mb-3">Termos de Serviço</h1>
        <p className="text-sm text-gray-500">
          Última atualização: <strong className="text-gray-300">{lastUpdated}</strong>
        </p>
      </div>

      <Section title="1. Aceitação dos Termos">
        <p>
          Ao acessar ou utilizar o <strong className="text-gray-200">FunnelGuard AI</strong>, você concorda
          com estes Termos de Serviço ("Termos"). Caso não concorde, não utilize a Plataforma.
          Estes Termos constituem um contrato vinculante entre você ("Usuário") e o FunnelGuard AI.
        </p>
      </Section>

      <Section title="2. Descrição do Serviço">
        <p>
          O FunnelGuard AI é uma plataforma de gerenciamento e otimização de campanhas de tráfego pago que oferece:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Auto-Pilot de campanhas (pausar, escalar, reduzir orçamento) via Meta Ads API;</li>
          <li>Motor de Correlação Estratégica com IA (GPT-4o);</li>
          <li>Monitoramento de preços de concorrentes;</li>
          <li>Auditoria de Landing Pages e funil de conversão;</li>
          <li>Lab de Criativos com geração de copy (AIDA/PAS);</li>
          <li>Relatórios semanais e alertas automáticos via e-mail.</li>
        </ul>
      </Section>

      <Section title="3. Elegibilidade e Conta">
        <p>
          Para usar a Plataforma, você deve: (a) ter 18 anos ou mais; (b) ter uma conta ativa na
          Meta Business Suite; (c) ter autoridade legal para vincular sua empresa aos presentes Termos.
        </p>
        <p>
          Você é responsável pela segurança de sua conta e senha. Notifique-nos imediatamente em caso
          de acesso não autorizado: <strong className="text-gray-200">suporte@funnelguard.ai</strong>.
        </p>
      </Section>

      <Section title="4. Uso Aceitável e Proibições">
        <p>É proibido:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Usar a Plataforma para fins ilegais ou fraudulentos;</li>
          <li>Tentar fazer engenharia reversa, descompilar ou copiar o software;</li>
          <li>Usar a Plataforma para gerenciar campanhas que violem as políticas de publicidade da Meta;</li>
          <li>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
          <li>Realizar ataques de negação de serviço (DoS/DDoS) ou scraping abusivo da Plataforma.</li>
        </ul>
      </Section>

      <Section title="5. Conexão com a Meta e Responsabilidades">
        <p>
          O FunnelGuard AI atua como uma ferramenta intermediária entre o usuário e a Meta Ads API.
          Ao conectar sua conta da Meta, você autoriza o FunnelGuard AI a tomar ações em seu nome
          (pausar campanhas, alterar orçamentos) conforme as configurações definidas por você.
        </p>
        <p>
          <strong className="text-gray-200">O FunnelGuard AI não é responsável por</strong> decisões
          financeiras resultantes das ações automáticas do Auto-Pilot. O usuário é o único responsável
          pela configuração dos limites de ROAS, orçamentos e demais parâmetros.
        </p>
        <p>
          A disponibilidade do serviço está sujeita à disponibilidade da Meta Ads API, sobre a qual não
          temos controle. Não garantimos disponibilidade ininterrupta.
        </p>
      </Section>

      <Section title="6. Planos, Pagamento e Cancelamento">
        <p>
          A Plataforma oferece planos pagos processados pelo Stripe. Preços e condições são exibidos
          na página de Planos. Cobranças são realizadas de forma recorrente conforme o período contratado.
        </p>
        <p>
          Você pode cancelar a assinatura a qualquer momento. O acesso permanece ativo até o fim do
          período pago. Não há reembolsos proporcionais, exceto quando exigido por lei aplicável.
        </p>
      </Section>

      <Section title="7. Propriedade Intelectual">
        <p>
          O FunnelGuard AI e todo seu conteúdo, código-fonte, marca, logotipo e funcionalidades são
          de propriedade exclusiva da empresa. Concedemos ao usuário uma licença limitada, não exclusiva
          e intransferível para usar a Plataforma conforme estes Termos.
        </p>
        <p>
          Os dados gerados pelo usuário (campanhas, métricas, criativos) permanecem de propriedade do usuário.
        </p>
      </Section>

      <Section title="8. Limitação de Responsabilidade">
        <p>
          Na máxima extensão permitida por lei, o FunnelGuard AI não se responsabiliza por danos
          indiretos, incidentais, especiais ou consequentes, incluindo perda de receita publicitária,
          perda de dados ou interrupção de negócios.
        </p>
        <p>
          Nossa responsabilidade total está limitada ao valor pago pelo usuário nos últimos 3 meses.
        </p>
      </Section>

      <Section title="9. Modificações e Rescisão">
        <p>
          Reservamo-nos o direito de modificar estes Termos a qualquer tempo, com aviso prévio de 30 dias
          por e-mail para alterações substanciais. O uso continuado após a notificação constitui aceitação.
        </p>
        <p>
          Podemos suspender ou encerrar sua conta em caso de violação destes Termos, com notificação prévia
          exceto em casos de fraude ou dano imediato à Plataforma.
        </p>
      </Section>

      <Section title="10. Lei Aplicável e Foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir eventuais
          controvérsias, fica eleito o foro da comarca de [cidade — a definir], com renúncia a qualquer outro.
        </p>
      </Section>

      <Section title="11. Contato">
        <p>
          Dúvidas sobre os Termos: <strong className="text-gray-200">juridico@funnelguard.ai</strong>
        </p>
      </Section>
    </article>
  )
}

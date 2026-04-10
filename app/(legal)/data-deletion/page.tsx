import type { Metadata } from 'next'
import { Trash2, CheckCircle2, Clock, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Instruções de Exclusão de Dados | FunnelGuard AI',
  description:
    'Como solicitar a exclusão dos seus dados no FunnelGuard AI — exigência obrigatória da Meta para apps com Login do Facebook.',
}

export default function DataDeletionPage() {
  const steps = [
    {
      icon: Mail,
      title: 'Envie a solicitação',
      description: 'Envie um e-mail para privacidade@funnelguard.ai com o assunto "Exclusão de Dados" e o e-mail associado à sua conta FunnelGuard AI.',
    },
    {
      icon: CheckCircle2,
      title: 'Confirmação em 48h',
      description: 'Nossa equipe confirmará o recebimento da solicitação dentro de 48 horas úteis e iniciará o processo de exclusão.',
    },
    {
      icon: Clock,
      title: 'Exclusão em até 30 dias',
      description: 'Todos os seus dados pessoais serão permanentemente excluídos de nossos sistemas dentro de 30 dias corridos, conforme exigido pela LGPD.',
    },
  ]

  const whatIsDeleted = [
    'Sua conta de usuário e dados de perfil (nome, e-mail, foto)',
    'Tokens de acesso à Meta Ads API (imediatamente revogados)',
    'Histórico de campanhas e métricas de desempenho',
    'Logs de decisões do Auto-Pilot',
    'Dados de auditoria de landing pages',
    'Histórico de preços de concorrentes',
    'Criativos gerados pelo Lab de Criativos',
    'Dados de assinatura (somente no FunnelGuard AI — o Stripe mantém registros conforme suas obrigações legais)',
  ]

  const whatIsRetained = [
    'Registros de faturamento por até 5 anos (obrigação fiscal)',
    'Logs de acesso anonimizados por até 6 meses (obrigação de segurança)',
  ]

  return (
    <article>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Exigência Meta Platform</p>
        <h1 className="text-3xl font-extrabold text-white mb-3 flex items-center gap-3">
          <Trash2 className="w-7 h-7 text-red-400" />
          Instruções de Exclusão de Dados
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Esta página atende à exigência obrigatória da Meta Platforms para aplicativos que utilizam
          o Login com o Facebook. Ela descreve como você pode solicitar a exclusão completa dos seus
          dados do FunnelGuard AI.
        </p>
      </div>

      {/* Aviso Meta */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-8 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-base">ℹ️</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-300 mb-1">Nota sobre o Login com o Facebook</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Se você usou o "Entrar com o Facebook" para criar sua conta, revogar o acesso do aplicativo
            nas configurações do Facebook (<strong className="text-gray-300">Facebook → Configurações → Aplicativos e Sites → FunnelGuard AI → Remover</strong>)
            revogará imediatamente os tokens de acesso. Esta página trata da exclusão dos dados
            armazenados em nossos servidores.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-white mb-5 border-l-2 border-red-500 pl-3">
          Como solicitar a exclusão
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="glass-card rounded-xl border border-gray-800 p-4">
                <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-600 font-mono">0{i + 1}</span>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Email */}
      <div className="p-5 rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Solicitar exclusão agora</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Envie e-mail com o assunto: <span className="font-mono text-neon-cyan">"Exclusão de Dados — [seu e-mail]"</span>
          </p>
        </div>
        <a
          href="mailto:privacidade@funnelguard.ai?subject=Exclusão%20de%20Dados%20—%20FunnelGuard%20AI"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-cyan text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          privacidade@funnelguard.ai
        </a>
      </div>

      {/* O que é excluído */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-base font-bold text-white mb-4 border-l-2 border-red-500 pl-3">
            O que será excluído
          </h2>
          <ul className="space-y-2">
            {whatIsDeleted.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                <Trash2 className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-base font-bold text-white mb-4 border-l-2 border-yellow-500 pl-3">
            O que pode ser retido (obrigação legal)
          </h2>
          <ul className="space-y-2">
            {whatIsRetained.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-4">
            Após o prazo legal, esses dados também serão excluídos permanentemente.
          </p>
        </div>
      </div>

      {/* Confirmation URL para o Meta */}
      <div className="p-4 rounded-xl border border-gray-800 bg-white/2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          URL de Confirmação (para o Meta App Review)
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Esta página está disponível publicamente em:{' '}
          <code className="text-neon-cyan font-mono text-xs bg-neon-cyan/10 px-2 py-0.5 rounded">
            https://funnelguard.ai/data-deletion
          </code>
          . Após o processamento da exclusão, o solicitante receberá um código de confirmação por e-mail.
        </p>
      </div>
    </article>
  )
}

import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export async function generateMetadata() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.termsOfService
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3 border-l-2 border-neon-purple pl-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default async function TermsOfServicePage() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.termsOfService
  const lastUpdated = t.lastUpdatedValue

  return (
    <article>
      <div className="mb-10">
        <p className="text-xs font-semibold text-neon-purple uppercase tracking-wider mb-2">{t.badge}</p>
        <h1 className="text-3xl font-extrabold text-white mb-3">{t.title}</h1>
        <p className="text-sm text-gray-500">
          {t.lastUpdatedLabel} <strong className="text-gray-300">{lastUpdated}</strong>
        </p>
      </div>

      <Section title={t.section1Title}>
        <p>
          {t.section1P1a}
          <strong className="text-gray-200">FunnelGuard AI</strong>
          {t.section1P1b}
        </p>
      </Section>

      <Section title={t.section2Title}>
        <p>{t.section2Intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          {t.section2Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.section3Title}>
        <p>{t.section3P1}</p>
        <p>
          {t.section3P2a}
          <strong className="text-gray-200">suporte@funnelguard.ai</strong>
          {t.section3P2b}
        </p>
      </Section>

      <Section title={t.section4Title}>
        <p>{t.section4Intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          {t.section4Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.section5Title}>
        <p>{t.section5P1}</p>
        <p>
          <strong className="text-gray-200">{t.section5P2Bold}</strong>
          {t.section5P2Rest}
        </p>
        <p>{t.section5P3}</p>
      </Section>

      <Section title={t.section6Title}>
        <p>{t.section6P1}</p>
        <p>{t.section6P2}</p>
      </Section>

      <Section title={t.section7Title}>
        <p>{t.section7P1}</p>
        <p>{t.section7P2}</p>
      </Section>

      <Section title={t.section8Title}>
        <p>{t.section8P1}</p>
        <p>{t.section8P2}</p>
      </Section>

      <Section title={t.section9Title}>
        <p>{t.section9P1}</p>
        <p>{t.section9P2}</p>
      </Section>

      <Section title={t.section10Title}>
        <p>{t.section10P1}</p>
      </Section>

      <Section title={t.section11Title}>
        <p>
          {t.section11P1a}
          <strong className="text-gray-200">juridico@funnelguard.ai</strong>
        </p>
      </Section>
    </article>
  )
}

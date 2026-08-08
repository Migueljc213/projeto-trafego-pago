import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export async function generateMetadata() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.privacyPolicy
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3 border-l-2 border-neon-cyan pl-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>
    </section>
  )
}

export default async function PrivacyPolicyPage() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.privacyPolicy
  const lastUpdated = t.lastUpdatedValue

  return (
    <article>
      <div className="mb-10">
        <p className="text-xs font-semibold text-neon-cyan uppercase tracking-wider mb-2">{t.badge}</p>
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
          <strong className="text-gray-200">{t.section1P1LgpdBold}</strong>
          {t.section1P1c}
          <strong className="text-gray-200">{t.section1P1GdprBold}</strong>
          {t.section1P1d}
          <strong className="text-gray-200">{t.section1P1MetaBold}</strong>
          {t.section1P1e}
        </p>
        <p>{t.section1P2}</p>
      </Section>

      <Section title={t.section2Title}>
        <p>{t.section2Intro}</p>
        <ul className="list-disc pl-5 space-y-2">
          {t.section2Items.map((item, i) => (
            <li key={i}>
              <strong className="text-gray-200">{item.label}</strong>
              {item.rest}
              {'bold2' in item && item.bold2 && (
                <strong className="text-gray-200">{item.bold2}</strong>
              )}
              {'rest2' in item && item.rest2}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.section3Title}>
        <p>{t.section3Intro}</p>
        <ul className="list-disc pl-5 space-y-2">
          {t.section3Items.map((item, i) => (
            <li key={i}>
              <strong className="text-gray-200">{item.label}</strong>
              {item.rest}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.section4Title}>
        <p>
          {t.section4P1a}
          <strong className="text-gray-200">{t.section4P1MetaApiBold}</strong>
          {t.section4P1b}
        </p>
        <p>{t.section4P2}</p>
        <p>
          {t.section4P3a}
          <strong className="text-gray-200">{t.section4P3TermsBold}</strong>
          {t.section4P3b}
        </p>
      </Section>

      <Section title={t.section5Title}>
        <p>{t.section5Intro}</p>
        <ul className="list-disc pl-5 space-y-2">
          {t.section5Items.map((item, i) => (
            <li key={i}>
              <strong className="text-gray-200">{item.label}</strong>
              {item.rest}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.section6Title}>
        <p>{t.section6Intro}</p>
        <ul className="list-disc pl-5 space-y-2">
          {t.section6Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.section7Title}>
        <p>{t.section7P1}</p>
      </Section>

      <Section title={t.section8Title}>
        <p>{t.section8Intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          {t.section8Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {t.section8OutroA}
          <strong className="text-gray-200">privacidade@funnelguard.ai</strong>
          {t.section8OutroB}
          <a href="/data-deletion" className="text-neon-cyan hover:underline">
            {t.section8OutroLinkLabel}
          </a>
          {t.section8OutroC}
        </p>
      </Section>

      <Section title={t.section9Title}>
        <p>{t.section9P1}</p>
      </Section>

      <Section title={t.section10Title}>
        <p>
          {t.section10DpoLabel}
          <strong className="text-gray-200">privacidade@funnelguard.ai</strong>
          <br />
          {t.section10ComplaintPrefix}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
            www.gov.br/anpd
          </a>
        </p>
      </Section>
    </article>
  )
}

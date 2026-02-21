import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { resolveLocale } from '@/i18n/resolve-locale'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

// SSOT for quota values: TIER_QUOTAS in lib/constants/quotas.ts
// anonymous: 3/day, free: 15/month

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'footer',
  })
  return { title: t('terms') }
}

const CONTENT = {
  fr: {
    title: 'Conditions d\u2019utilisation',
    subtitle: 'Derni\u00e8re mise \u00e0 jour\u00a0: f\u00e9vrier 2026',
    sections: [
      {
        heading: 'Acceptation des conditions',
        paragraphs: [
          'En acc\u00e9dant au site fullstackhuman.com et en utilisant le service, vous acceptez les pr\u00e9sentes conditions d\u2019utilisation. Si vous n\u2019acceptez pas ces conditions, veuillez ne pas utiliser le service.',
        ],
      },
      {
        heading: 'Description du service',
        paragraphs: [
          'Fullstackhuman est un outil de conseil assist\u00e9 par intelligence artificielle. Il propose trois modes de conversation (Le Docteur, Le Critique, Le Guide), chacun con\u00e7u pour aborder diff\u00e9rents aspects de vos projets produit et tech.',
          'Le service est aliment\u00e9 par l\u2019API Claude d\u2019Anthropic. Les r\u00e9ponses sont g\u00e9n\u00e9r\u00e9es par l\u2019IA et ne constituent pas un conseil professionnel. Elles ne remplacent pas l\u2019expertise d\u2019un consultant, d\u2019un avocat, ou de tout autre professionnel qualifi\u00e9.',
        ],
      },
      {
        heading: 'Utilisation acceptable',
        paragraphs: [
          'Vous vous engagez \u00e0 utiliser le service de mani\u00e8re l\u00e9gitime et dans le respect de la loi. Il est interdit de\u00a0: tenter de manipuler ou de contourner les protections du syst\u00e8me (injection de prompt, contournement de quota), usurper l\u2019identit\u00e9 d\u2019une autre personne, utiliser le service pour g\u00e9n\u00e9rer du contenu ill\u00e9gal, nuisible ou trompeur, ou soumettre intentionnellement des donn\u00e9es personnelles de tiers sans leur consentement.',
        ],
      },
      {
        heading: 'Contenu g\u00e9n\u00e9r\u00e9 par l\u2019IA',
        paragraphs: [
          'Les r\u00e9ponses fournies par l\u2019IA sont g\u00e9n\u00e9r\u00e9es automatiquement et peuvent contenir des erreurs, des inexactitudes ou des informations obsol\u00e8tes. Vous \u00eates seul responsable de l\u2019utilisation que vous faites des r\u00e9ponses et des rapports g\u00e9n\u00e9r\u00e9s.',
          'Les rapports et diagnostics produits ne constituent pas un avis professionnel et ne doivent pas \u00eatre utilis\u00e9s comme seule base de d\u00e9cision pour des questions juridiques, financi\u00e8res ou m\u00e9dicales.',
        ],
      },
      {
        heading: 'Quotas et limites',
        paragraphs: [
          'Les utilisateurs anonymes sont limit\u00e9s \u00e0 3 conversations par jour. Les utilisateurs ayant un compte gratuit disposent de 15 conversations par mois. Ces limites peuvent \u00eatre modifi\u00e9es \u00e0 tout moment.',
        ],
      },
      {
        heading: 'Limitation de responsabilit\u00e9',
        paragraphs: [
          'Le service est fourni \u00ab\u00a0en l\u2019\u00e9tat\u00a0\u00bb, sans aucune garantie expresse ou implicite. Nous ne garantissons pas la disponibilit\u00e9 continue, l\u2019absence d\u2019erreur, ni l\u2019exactitude des r\u00e9ponses g\u00e9n\u00e9r\u00e9es.',
          'Dans les limites autoris\u00e9es par la loi, notre responsabilit\u00e9 ne pourra \u00eatre engag\u00e9e pour tout dommage indirect, accessoire, sp\u00e9cial ou cons\u00e9cutif r\u00e9sultant de l\u2019utilisation ou de l\u2019impossibilit\u00e9 d\u2019utiliser le service.',
        ],
      },
      {
        heading: 'Disponibilit\u00e9 du service',
        paragraphs: [
          'Nous nous effor\u00e7ons de maintenir le service disponible, mais aucune garantie de disponibilit\u00e9 (SLA) n\u2019est offerte. Le service peut \u00eatre interrompu temporairement pour maintenance, mise \u00e0 jour ou en cas de force majeure.',
        ],
      },
      {
        heading: 'Modification des conditions',
        paragraphs: [
          'Nous nous r\u00e9servons le droit de modifier ces conditions \u00e0 tout moment. Les modifications prennent effet d\u00e8s leur publication sur cette page. La date de derni\u00e8re mise \u00e0 jour est indiqu\u00e9e en haut de cette page.',
        ],
      },
      {
        heading: 'Droit applicable',
        paragraphs: [
          'Les pr\u00e9sentes conditions sont r\u00e9gies par le droit fran\u00e7ais. Tout litige sera soumis \u00e0 la comp\u00e9tence exclusive des tribunaux fran\u00e7ais.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: ['Pour toute question\u00a0: contact@fullstackhuman.com'],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    subtitle: 'Last updated: February 2026',
    sections: [
      {
        heading: 'Acceptance of terms',
        paragraphs: [
          'By accessing fullstackhuman.com and using the service, you agree to these terms of service. If you do not agree, please do not use the service.',
        ],
      },
      {
        heading: 'Service description',
        paragraphs: [
          'Fullstackhuman is an AI-assisted consulting tool. It offers three conversation modes (The Doctor, The Critic, The Guide), each designed to address different aspects of your product and tech projects.',
          'The service is powered by the Anthropic Claude API. Responses are generated by AI and do not constitute professional advice. They are not a substitute for the expertise of a consultant, lawyer, or any other qualified professional.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'You agree to use the service lawfully and in compliance with applicable laws. You must not: attempt to manipulate or bypass system protections (prompt injection, quota circumvention), impersonate another person, use the service to generate illegal, harmful, or misleading content, or intentionally submit personal data of third parties without their consent.',
        ],
      },
      {
        heading: 'AI-generated content',
        paragraphs: [
          'AI responses are generated automatically and may contain errors, inaccuracies, or outdated information. You are solely responsible for how you use the responses and reports generated.',
          'Reports and diagnostics produced do not constitute professional advice and should not be used as the sole basis for legal, financial, or medical decisions.',
        ],
      },
      {
        heading: 'Quotas and limits',
        paragraphs: [
          'Anonymous users are limited to 3 conversations per day. Free account users have 15 conversations per month. These limits may be modified at any time.',
        ],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'The service is provided "as is" without any express or implied warranty. We do not guarantee continuous availability, error-free operation, or the accuracy of generated responses.',
          'To the extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use the service.',
        ],
      },
      {
        heading: 'Service availability',
        paragraphs: [
          'We strive to keep the service available, but no service level agreement (SLA) is offered. The service may be temporarily interrupted for maintenance, updates, or due to force majeure.',
        ],
      },
      {
        heading: 'Changes to terms',
        paragraphs: [
          'We reserve the right to modify these terms at any time. Changes take effect upon publication on this page. The last update date is indicated at the top of this page.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by French law. Any dispute shall be subject to the exclusive jurisdiction of the French courts.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: ['For any questions: contact@fullstackhuman.com'],
      },
    ],
  },
} as const

export default async function TermsPage({ params }: Props) {
  const content =
    resolveLocale((await params).locale) === 'fr' ? CONTENT.fr : CONTENT.en
  return (
    <LegalPageLayout
      title={content.title}
      subtitle={content.subtitle}
      sections={content.sections}
    />
  )
}

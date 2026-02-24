import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { resolveLocale } from '@/i18n/resolve-locale'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'footer',
  })
  return { title: t('legal') }
}

const CONTENT = {
  fr: {
    title: 'Mentions l\u00e9gales',
    subtitle: 'Derni\u00e8re mise \u00e0 jour\u00a0: f\u00e9vrier 2026',
    sections: [
      {
        heading: '\u00c9diteur du site',
        paragraphs: [
          'Le site fullstackhuman.sh est \u00e9dit\u00e9 par\u00a0: FSC CONSULTING',
          'Forme juridique\u00a0: EURL (Entreprise Unipersonnelle \u00e0 Responsabilit\u00e9 Limit\u00e9e)',
          'Capital social\u00a0: 1\u00a0000,00\u00a0\u20ac',
          'SIRET\u00a0: 851\u00a0331\u00a0298\u00a000022',
          'TVA intracommunautaire\u00a0: FR08851331298',
          'RCS\u00a0: 851\u00a0331\u00a0298 R.C.S. Nanterre',
          'Si\u00e8ge social\u00a0: 42 rue Voltaire, 92800 Puteaux, France',
          'Email\u00a0: hello@fullstackhuman.sh',
        ],
      },
      {
        heading: 'Directeur de la publication',
        paragraphs: ['Fran\u00e7ois Schuers'],
      },
      {
        heading: 'H\u00e9bergement',
        paragraphs: [
          'Le site est h\u00e9berg\u00e9 par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, \u00c9tats-Unis. Site web\u00a0: https://vercel.com',
          'Les donn\u00e9es d\u2019authentification sont g\u00e9r\u00e9es par Supabase Inc. Site web\u00a0: https://supabase.com',
        ],
      },
      {
        heading: 'Propri\u00e9t\u00e9 intellectuelle',
        paragraphs: [
          'L\u2019ensemble du contenu du site (textes, graphismes, logos, code source) est prot\u00e9g\u00e9 par le droit de la propri\u00e9t\u00e9 intellectuelle. Toute reproduction, m\u00eame partielle, est interdite sans autorisation pr\u00e9alable.',
          'Les rapports g\u00e9n\u00e9r\u00e9s par l\u2019IA sont destin\u00e9s \u00e0 l\u2019usage personnel de l\u2019utilisateur. Leur redistribution commerciale est interdite.',
        ],
      },
      {
        heading: 'Donn\u00e9es personnelles',
        paragraphs: [
          'Pour toute information relative au traitement de vos donn\u00e9es personnelles, veuillez consulter notre Politique de confidentialit\u00e9.',
        ],
      },
      {
        heading: 'Droit applicable',
        paragraphs: [
          'Les pr\u00e9sentes mentions l\u00e9gales sont r\u00e9gies par le droit fran\u00e7ais, conform\u00e9ment \u00e0 la loi n\u00b0\u00a02004-575 du 21 juin 2004 pour la confiance dans l\u2019\u00e9conomie num\u00e9rique (LCEN).',
        ],
      },
    ],
  },
  en: {
    title: 'Legal Notice',
    subtitle: 'Last updated: February 2026',
    sections: [
      {
        heading: 'Website publisher',
        paragraphs: [
          'The website fullstackhuman.sh is published by: FSC CONSULTING',
          'Legal form: EURL (Single-Member Limited Liability Company)',
          'Share capital: \u20ac1,000.00',
          'Registration number (SIRET): 851 331 298 00022',
          'EU VAT number: FR08851331298',
          'Trade register: 851 331 298 R.C.S. Nanterre',
          'Registered office: 42 rue Voltaire, 92800 Puteaux, France',
          'Email: hello@fullstackhuman.sh',
        ],
      },
      {
        heading: 'Publication director',
        paragraphs: ['Fran\u00e7ois Schuers'],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          'The website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States. Website: https://vercel.com',
          'Authentication data is managed by Supabase Inc. Website: https://supabase.com',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'All website content (text, graphics, logos, source code) is protected by intellectual property law. Any reproduction, even partial, is prohibited without prior authorization.',
          'AI-generated reports are intended for the personal use of the user. Commercial redistribution is prohibited.',
        ],
      },
      {
        heading: 'Personal data',
        paragraphs: [
          'For information regarding the processing of your personal data, please refer to our Privacy Policy.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'This legal notice is governed by French law, in accordance with Law No. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN).',
        ],
      },
    ],
  },
} as const

export default async function LegalPage({ params }: Props) {
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

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { resolveLocale } from '@/i18n/resolve-locale'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

// SSOT for cookie names: CONSENT_COOKIE_NAME in lib/constants/legal.ts,
// RATE_LIMIT_COOKIE_NAME in lib/constants/chat.ts

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'footer',
  })
  return { title: t('privacy') }
}

const CONTENT = {
  fr: {
    title: 'Politique de confidentialit\u00e9',
    subtitle: 'Derni\u00e8re mise \u00e0 jour\u00a0: f\u00e9vrier 2026',
    sections: [
      {
        heading: 'Responsable du traitement',
        paragraphs: [
          'Le responsable du traitement des donn\u00e9es personnelles collect\u00e9es sur le site fullstackhuman.sh est\u00a0: FSC CONSULTING, EURL au capital de 1\u00a0000,00\u00a0\u20ac, SIRET 851\u00a0331\u00a0298\u00a000022, 42 rue Voltaire, 92800 Puteaux, France.',
          'Contact\u00a0: hello@fullstackhuman.sh',
        ],
      },
      {
        heading: 'Donn\u00e9es collect\u00e9es',
        paragraphs: [
          'Nous collectons les donn\u00e9es suivantes\u00a0: adresse email (lors de la cr\u00e9ation de compte), nom d\u2019affichage (facultatif), contenu des conversations avec l\u2019IA, et m\u00e9tadonn\u00e9es d\u2019utilisation (horodatage des conversations, persona s\u00e9lectionn\u00e9e).',
          'Pour les utilisateurs anonymes (sans compte), aucune donn\u00e9e personnelle identifiante n\u2019est collect\u00e9e. Un cookie fonctionnel peut \u00eatre utilis\u00e9 pour suivre le quota de conversations, sous r\u00e9serve de votre consentement.',
        ],
      },
      {
        heading: 'Traitement des donn\u00e9es',
        paragraphs: [
          'Le contenu de vos conversations est envoy\u00e9 \u00e0 l\u2019API Claude d\u2019Anthropic pour g\u00e9n\u00e9rer les r\u00e9ponses de l\u2019IA. Anthropic traite ces donn\u00e9es conform\u00e9ment \u00e0 sa propre politique de confidentialit\u00e9, disponible \u00e0 l\u2019adresse\u00a0: https://www.anthropic.com/legal/privacy',
          'L\u2019authentification est g\u00e9r\u00e9e par Supabase (Supabase Inc., Singapour). Les donn\u00e9es de compte (email, mot de passe hash\u00e9) sont stock\u00e9es dans une base de donn\u00e9es avec chiffrement au repos et politiques de s\u00e9curit\u00e9 au niveau des lignes (RLS).',
          'L\u2019h\u00e9bergement est assur\u00e9 par Vercel Inc. (San Francisco, \u00c9tats-Unis). Les donn\u00e9es peuvent transiter par des serveurs situ\u00e9s hors de l\u2019UE. Des garanties contractuelles (clauses contractuelles types) encadrent ces transferts.',
        ],
      },
      {
        heading: 'Cookies utilis\u00e9s',
        paragraphs: [
          'fsh_consent\u00a0: Cookie strictement n\u00e9cessaire. Stocke votre choix de consentement aux cookies. Dur\u00e9e\u00a0: 6 mois. Aucun consentement requis.',
          'fsh_conversations\u00a0: Cookie fonctionnel. Suit le nombre de conversations anonymes pour appliquer le quota journalier. Dur\u00e9e\u00a0: 24 heures. N\u00e9cessite votre consentement.',
          'sb-*\u00a0: Cookies strictement n\u00e9cessaires. G\u00e8rent l\u2019authentification et la session utilisateur (Supabase). Aucun consentement requis.',
        ],
      },
      {
        heading: 'Vos droits',
        paragraphs: [
          'Conform\u00e9ment au R\u00e8glement G\u00e9n\u00e9ral sur la Protection des Donn\u00e9es (RGPD), vous disposez des droits suivants\u00a0: droit d\u2019acc\u00e8s (art.\u00a015), droit de rectification (art.\u00a016), droit \u00e0 l\u2019effacement (art.\u00a017), droit \u00e0 la portabilit\u00e9 (art.\u00a020), droit d\u2019opposition (art.\u00a021), et droit \u00e0 la limitation du traitement (art.\u00a018).',
          'Vous pouvez supprimer votre compte et toutes les donn\u00e9es associ\u00e9es directement depuis la page Param\u00e8tres du compte. Pour toute autre demande, contactez-nous \u00e0 hello@fullstackhuman.sh.',
          'Vous avez \u00e9galement le droit d\u2019introduire une r\u00e9clamation aupr\u00e8s de la CNIL (Commission Nationale de l\u2019Informatique et des Libert\u00e9s)\u00a0: www.cnil.fr',
        ],
      },
      {
        heading: 'Conservation des donn\u00e9es',
        paragraphs: [
          'Contenu des conversations\u00a0: les conversations ne sont actuellement pas persist\u00e9es au-del\u00e0 de la session navigateur. Une fois l\u2019onglet ferm\u00e9, le contenu est perdu.',
          'Donn\u00e9es de compte (email, nom)\u00a0: conserv\u00e9es jusqu\u2019\u00e0 la suppression du compte par l\u2019utilisateur.',
          'Cookies fonctionnels\u00a0: dur\u00e9e de vie de 24 heures maximum.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Pour toute question relative \u00e0 la protection de vos donn\u00e9es personnelles\u00a0: hello@fullstackhuman.sh',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Last updated: February 2026',
    sections: [
      {
        heading: 'Data controller',
        paragraphs: [
          'The data controller for personal data collected on fullstackhuman.sh is: FSC CONSULTING, EURL with a share capital of \u20ac1,000.00, SIRET 851 331 298 00022, 42 rue Voltaire, 92800 Puteaux, France.',
          'Contact: hello@fullstackhuman.sh',
        ],
      },
      {
        heading: 'Data collected',
        paragraphs: [
          'We collect the following data: email address (when creating an account), display name (optional), conversation content with the AI, and usage metadata (conversation timestamps, selected persona).',
          'For anonymous users (without an account), no personally identifiable data is collected. A functional cookie may be used to track conversation quota, subject to your consent.',
        ],
      },
      {
        heading: 'Data processing',
        paragraphs: [
          'Your conversation content is sent to the Anthropic Claude API to generate AI responses. Anthropic processes this data in accordance with their own privacy policy, available at: https://www.anthropic.com/legal/privacy',
          'Authentication is managed by Supabase (Supabase Inc., Singapore). Account data (email, hashed password) is stored in a database with encryption at rest and row-level security (RLS) policies.',
          'Hosting is provided by Vercel Inc. (San Francisco, USA). Data may transit through servers located outside the EU. Contractual safeguards (standard contractual clauses) govern these transfers.',
        ],
      },
      {
        heading: 'Cookies used',
        paragraphs: [
          'fsh_consent: Strictly necessary cookie. Stores your cookie consent choice. Duration: 6 months. No consent required.',
          'fsh_conversations: Functional cookie. Tracks anonymous conversation count to enforce daily quota. Duration: 24 hours. Requires your consent.',
          'sb-*: Strictly necessary cookies. Manage user authentication and session (Supabase). No consent required.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'Under the General Data Protection Regulation (GDPR), you have the following rights: right of access (Art. 15), right to rectification (Art. 16), right to erasure (Art. 17), right to data portability (Art. 20), right to object (Art. 21), and right to restriction of processing (Art. 18).',
          'You can delete your account and all associated data directly from the Account Settings page. For any other request, contact us at hello@fullstackhuman.sh.',
          'You also have the right to lodge a complaint with the CNIL (French Data Protection Authority): www.cnil.fr',
        ],
      },
      {
        heading: 'Data retention',
        paragraphs: [
          'Conversation content: conversations are not currently persisted beyond the browser session. Once the tab is closed, the content is lost.',
          'Account data (email, name): retained until the user deletes their account.',
          'Functional cookies: maximum lifetime of 24 hours.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'For any questions regarding the protection of your personal data: hello@fullstackhuman.sh',
        ],
      },
    ],
  },
} as const

export default async function PrivacyPage({ params }: Props) {
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

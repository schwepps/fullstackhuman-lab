export type Urgency = 'normal' | 'important' | 'breaking'

export type Ministry =
  | 'verite-numerique'
  | 'production-culturelle'
  | 'planification-economique'
  | 'relations-exterieures'
  | 'solidarite-populaire'
  | 'education-revolutionnaire'
  | 'sante-du-peuple'
  | 'sport-heroique'

export type ArticleImage = 'tech' | 'economy' | 'international'

export interface Article {
  id: string
  headline: string
  summary: string
  ministry: Ministry
  urgency: Urgency
  image?: ArticleImage
  publishedAt: string
}

export interface Announcement {
  id: string
  content: string
  type: 'decree' | 'metric' | 'reminder' | 'slogan'
  value?: string
}

export interface MinistryInfo {
  label: string
  image?: string
}

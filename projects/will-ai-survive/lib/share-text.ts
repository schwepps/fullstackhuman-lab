import { getSiteUrl } from './constants'

type ShareParams = {
  resultId: string
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  breakingPoint: string
}

export function resultUrl(resultId: string): string {
  return `${getSiteUrl()}/result/${resultId}`
}

export function buildLinkedInShareText(params: ShareParams): string {
  return [
    `I made AI try my job. It lasted ${params.survivalDuration} before rage-quitting.`,
    '',
    `Chaos Rating: ${params.chaosRating}/10 — "${params.chaosLabel}"`,
    `Breaking point: "${params.breakingPoint}"`,
    '',
    `How long would AI survive YOUR job?`,
    resultUrl(params.resultId),
  ].join('\n')
}

export function buildXShareText(params: ShareParams): string {
  const base = `AI tried my job and lasted ${params.survivalDuration}\nBreaking point: "${params.breakingPoint}"\nChaos rating: ${params.chaosRating}/10`

  // X has a 280 char limit — URL is added separately via the intent
  if (base.length > 250) {
    return `AI tried my job and lasted ${params.survivalDuration}\nChaos rating: ${params.chaosRating}/10 — "${params.chaosLabel}"`
  }

  return base
}

export function buildLinkedInShareUrl(params: ShareParams): string {
  const text = buildLinkedInShareText(params)
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resultUrl(params.resultId))}&summary=${encodeURIComponent(text)}`
}

export function buildXShareUrl(params: ShareParams): string {
  const text = buildXShareText(params)
  const url = resultUrl(params.resultId)
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

import { getSiteUrl, APP_NAME } from './constants'

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

export function buildLinkedInPostText(params: ShareParams): string {
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
  const full = [
    `AI tried my job and lasted ${params.survivalDuration}`,
    `Chaos rating: ${params.chaosRating}/10 — "${params.chaosLabel}"`,
    `Breaking point: "${params.breakingPoint}"`,
  ].join('\n')

  // X has a 280 char limit — URL is added separately via the intent
  if (full.length > 250) {
    return `AI tried my job and lasted ${params.survivalDuration}\nChaos rating: ${params.chaosRating}/10 — "${params.chaosLabel}"`
  }

  return full
}

export function buildLinkedInShareUrl(params: ShareParams): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resultUrl(params.resultId))}`
}

export function buildXShareUrl(params: ShareParams): string {
  const text = buildXShareText(params)
  const url = resultUrl(params.resultId)
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

export function buildWhatsAppShareUrl(params: ShareParams): string {
  const text = [
    `AI tried my job and lasted ${params.survivalDuration} before rage-quitting.`,
    `Chaos: ${params.chaosRating}/10 — "${params.chaosLabel}"`,
    `Try yours:`,
    resultUrl(params.resultId),
  ].join('\n')
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildNativeShareData(params: ShareParams): ShareData {
  return {
    title: APP_NAME,
    text: `AI tried my job and lasted ${params.survivalDuration}. Chaos: ${params.chaosRating}/10 — "${params.chaosLabel}"`,
    url: resultUrl(params.resultId),
  }
}

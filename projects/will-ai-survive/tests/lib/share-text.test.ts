import { describe, it, expect } from 'vitest'
import {
  buildLinkedInPostText,
  buildXShareText,
  buildLinkedInShareUrl,
  buildXShareUrl,
  buildWhatsAppShareUrl,
  buildNativeShareData,
  resultUrl,
} from '@/lib/share-text'

const params = {
  resultId: 'abc123def456',
  chaosRating: 8,
  chaosLabel: 'Actively praying for a power outage',
  survivalDuration: '2 days, 14 hours',
  breakingPoint: 'The 4th Slack thread about which Slack threads to use',
}

describe('buildLinkedInPostText', () => {
  it('includes survival duration', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('2 days, 14 hours')
  })

  it('includes chaos rating', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('8/10')
  })

  it('includes chaos label', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('Actively praying for a power outage')
  })

  it('includes breaking point', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('Slack thread')
  })

  it('includes result URL with result ID', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('/result/abc123def456')
  })

  it('includes CTA', () => {
    const text = buildLinkedInPostText(params)
    expect(text).toContain('YOUR job')
  })
})

describe('buildXShareText', () => {
  it('includes core info', () => {
    const text = buildXShareText(params)
    expect(text).toContain('2 days, 14 hours')
    expect(text).toContain('8/10')
  })

  it('includes chaos label', () => {
    const text = buildXShareText(params)
    expect(text).toContain('Actively praying for a power outage')
  })

  it('stays within reasonable length', () => {
    const text = buildXShareText(params)
    expect(text.length).toBeLessThan(280)
  })
})

describe('resultUrl', () => {
  it('builds URL with result ID path', () => {
    const url = resultUrl('abc123def456')
    expect(url).toContain('/result/abc123def456')
    // Should start with a valid URL scheme
    expect(url).toMatch(/^https?:\/\//)
  })
})

describe('share URLs', () => {
  it('buildLinkedInShareUrl creates valid LinkedIn intent with url only', () => {
    const url = buildLinkedInShareUrl(params)
    expect(url).toContain('linkedin.com/sharing')
    expect(url).toContain(encodeURIComponent('/result/abc123def456'))
    // Must NOT contain deprecated summary param
    expect(url).not.toContain('summary=')
  })

  it('buildXShareUrl creates valid X intent', () => {
    const url = buildXShareUrl(params)
    expect(url).toContain('x.com/intent/tweet')
    expect(url).toContain(encodeURIComponent('/result/abc123def456'))
  })

  it('buildWhatsAppShareUrl creates valid WhatsApp link', () => {
    const url = buildWhatsAppShareUrl(params)
    expect(url).toContain('wa.me')
    expect(url).toContain(encodeURIComponent('2 days, 14 hours'))
    expect(url).toContain(encodeURIComponent('/result/abc123def456'))
  })
})

describe('buildNativeShareData', () => {
  it('returns valid ShareData shape', () => {
    const data = buildNativeShareData(params)
    expect(data).toHaveProperty('title')
    expect(data).toHaveProperty('text')
    expect(data).toHaveProperty('url')
    expect(data.url).toContain('/result/abc123def456')
  })

  it('includes chaos info in text', () => {
    const data = buildNativeShareData(params)
    expect(data.text).toContain('8/10')
    expect(data.text).toContain('2 days, 14 hours')
  })
})

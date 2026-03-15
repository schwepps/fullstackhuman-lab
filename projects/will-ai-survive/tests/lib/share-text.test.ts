import { describe, it, expect } from 'vitest'
import {
  buildLinkedInShareText,
  buildXShareText,
  buildLinkedInShareUrl,
  buildXShareUrl,
  resultUrl,
} from '@/lib/share-text'

const params = {
  resultId: 'abc123def456',
  chaosRating: 8,
  chaosLabel: 'Actively praying for a power outage',
  survivalDuration: '2 days, 14 hours',
  breakingPoint: 'The 4th Slack thread about which Slack threads to use',
}

describe('buildLinkedInShareText', () => {
  it('includes survival duration', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('2 days, 14 hours')
  })

  it('includes chaos rating', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('8/10')
  })

  it('includes chaos label', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('Actively praying for a power outage')
  })

  it('includes breaking point', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('Slack thread')
  })

  it('includes result URL with result ID', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('/result/abc123def456')
  })

  it('includes CTA', () => {
    const text = buildLinkedInShareText(params)
    expect(text).toContain('YOUR job')
  })
})

describe('buildXShareText', () => {
  it('includes core info', () => {
    const text = buildXShareText(params)
    expect(text).toContain('2 days, 14 hours')
    expect(text).toContain('8/10')
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
  it('buildLinkedInShareUrl creates valid LinkedIn intent', () => {
    const url = buildLinkedInShareUrl(params)
    expect(url).toContain('linkedin.com/sharing')
    expect(url).toContain(encodeURIComponent('/result/abc123def456'))
  })

  it('buildXShareUrl creates valid X intent', () => {
    const url = buildXShareUrl(params)
    expect(url).toContain('x.com/intent/tweet')
    expect(url).toContain(encodeURIComponent('/result/abc123def456'))
  })
})

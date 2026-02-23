import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ShareButton } from '@/components/report/share-button'

const mockTrackReportLinkCopied = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackReportLinkCopied: mockTrackReportLinkCopied,
  }),
}))

const MOCK_URL = 'https://fullstackhuman.com/report/abc123'

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders share link text initially', () => {
    render(<ShareButton shareUrl={MOCK_URL} persona="doctor" />)

    expect(screen.getByText('shareLink')).toBeInTheDocument()
  })

  it('copies share URL to clipboard on click', async () => {
    render(<ShareButton shareUrl={MOCK_URL} persona="doctor" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_URL)
  })

  it('shows copied feedback after click', async () => {
    render(<ShareButton shareUrl={MOCK_URL} persona="doctor" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(screen.getByText('linkCopied')).toBeInTheDocument()
  })

  it('tracks analytics with correct persona', async () => {
    render(<ShareButton shareUrl={MOCK_URL} persona="critic" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(mockTrackReportLinkCopied).toHaveBeenCalledWith({
      persona: 'critic',
    })
  })

  it('does not throw when clipboard API is unavailable', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
      },
    })

    render(<ShareButton shareUrl={MOCK_URL} persona="doctor" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    // Should not throw — still shows shareLink (not linkCopied)
    expect(screen.getByText('shareLink')).toBeInTheDocument()
  })
})

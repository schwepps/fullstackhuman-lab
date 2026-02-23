import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendlyCta } from '@/components/shared/calendly-cta'
import { CALENDLY_URL } from '@/lib/constants/app'

const mockTrackCalendlyClick = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackCalendlyClick: mockTrackCalendlyClick,
  }),
}))

describe('CalendlyCta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('inline variant', () => {
    it('renders a link to Calendly with correct attributes', () => {
      render(<CalendlyCta variant="inline" source="hero" />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', CALENDLY_URL)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders action text', () => {
      render(<CalendlyCta variant="inline" source="hero" />)

      expect(screen.getByText('action')).toBeInTheDocument()
    })

    it('does not render title or description', () => {
      render(<CalendlyCta variant="inline" source="hero" />)

      expect(screen.queryByText('title')).not.toBeInTheDocument()
      expect(screen.queryByText('description')).not.toBeInTheDocument()
    })

    it('tracks click with correct source', () => {
      render(<CalendlyCta variant="inline" source="report_card" />)

      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackCalendlyClick).toHaveBeenCalledWith({
        source: 'report_card',
      })
    })
  })

  describe('banner variant', () => {
    it('renders title, description, and action link', () => {
      render(<CalendlyCta variant="banner" source="conversations_dashboard" />)

      expect(screen.getByText('title')).toBeInTheDocument()
      expect(screen.getByText('description')).toBeInTheDocument()
      expect(screen.getByText('action')).toBeInTheDocument()
    })

    it('renders a link to Calendly with correct attributes', () => {
      render(<CalendlyCta variant="banner" source="conversations_dashboard" />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', CALENDLY_URL)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('tracks click with correct source', () => {
      render(<CalendlyCta variant="banner" source="conversations_dashboard" />)

      fireEvent.click(screen.getByRole('link'))

      expect(mockTrackCalendlyClick).toHaveBeenCalledWith({
        source: 'conversations_dashboard',
      })
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <CalendlyCta variant="banner" source="hero" className="mt-4" />
    )

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('mt-4')
  })
})

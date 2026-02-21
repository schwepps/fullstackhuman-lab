import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SignupCta } from '@/components/chat/signup-cta'

const mockTrackCtaClick = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/routing', () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackCtaClick: mockTrackCtaClick,
  }),
}))

describe('SignupCta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title, description, and action button', () => {
    render(<SignupCta remaining={2} limit={3} />)

    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('action')).toBeInTheDocument()
  })

  it('renders quota info when remaining and limit are provided', () => {
    render(<SignupCta remaining={2} limit={3} />)

    expect(screen.getByText('remaining')).toBeInTheDocument()
  })

  it('does not render quota info when remaining is null', () => {
    render(<SignupCta remaining={null} limit={3} />)

    expect(screen.queryByText('remaining')).not.toBeInTheDocument()
  })

  it('does not render quota info when limit is null', () => {
    render(<SignupCta remaining={2} limit={null} />)

    expect(screen.queryByText('remaining')).not.toBeInTheDocument()
  })

  it('links to the signup page', () => {
    render(<SignupCta remaining={2} limit={3} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/auth/signup')
  })

  // Note: Link is mocked as a plain <a>, so this does not test Radix Slot
  // prop-merging. An E2E test should verify the real click path.
  it('tracks CTA click with correct source', () => {
    render(<SignupCta remaining={2} limit={3} />)

    fireEvent.click(screen.getByRole('link'))

    expect(mockTrackCtaClick).toHaveBeenCalledWith({
      source: 'signup_post_report',
    })
  })
})

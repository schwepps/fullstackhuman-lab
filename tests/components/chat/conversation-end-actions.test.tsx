import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationEndActions } from '@/components/chat/conversation-end-actions'

const mockTrackBookingClick = vi.fn()
const mockOnStartNew = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/i18n/routing', () => ({
  Link: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    trackBookingClick: mockTrackBookingClick,
  }),
}))

describe('ConversationEndActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders booking CTA banner and start new button', () => {
    render(<ConversationEndActions onStartNew={mockOnStartNew} />)

    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('action')).toBeInTheDocument()
    expect(screen.getByText('startNew')).toBeInTheDocument()
  })

  it('calls onStartNew when button is clicked', () => {
    render(<ConversationEndActions onStartNew={mockOnStartNew} />)

    fireEvent.click(screen.getByText('startNew'))

    expect(mockOnStartNew).toHaveBeenCalledOnce()
  })

  it('tracks booking click with chat_end source', () => {
    render(<ConversationEndActions onStartNew={mockOnStartNew} />)

    fireEvent.click(screen.getByText('action'))

    expect(mockTrackBookingClick).toHaveBeenCalledWith({
      source: 'chat_end',
    })
  })
})

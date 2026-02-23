import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog'

const mockDeleteConversation = vi.fn()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/conversations/actions', () => ({
  deleteConversation: (...args: unknown[]) => mockDeleteConversation(...args),
}))

const MOCK_CONVERSATION_ID = '550e8400-e29b-41d4-a716-446655440000'

function renderDialog(
  overrides: Partial<{
    hasReport: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleted: () => void
  }> = {}
) {
  const props = {
    conversationId: MOCK_CONVERSATION_ID,
    hasReport: false,
    open: true,
    onOpenChange: vi.fn(),
    onDeleted: vi.fn(),
    ...overrides,
  }
  return { ...render(<DeleteConversationDialog {...props} />), props }
}

describe('DeleteConversationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog with title and description', () => {
    renderDialog()

    expect(screen.getByText('deleteConfirm')).toBeInTheDocument()
    expect(screen.getByText('deleteDescription')).toBeInTheDocument()
  })

  it('shows shared report warning when hasReport is true', () => {
    renderDialog({ hasReport: true })

    expect(screen.getByText('deleteSharedWarning')).toBeInTheDocument()
  })

  it('hides shared report warning when hasReport is false', () => {
    renderDialog({ hasReport: false })

    expect(screen.queryByText('deleteSharedWarning')).not.toBeInTheDocument()
  })

  it('calls deleteConversation with conversation ID on confirm', async () => {
    mockDeleteConversation.mockResolvedValue({ success: true })

    renderDialog()

    await act(async () => {
      fireEvent.click(screen.getByText('deleteSubmit'))
    })

    expect(mockDeleteConversation).toHaveBeenCalledWith(MOCK_CONVERSATION_ID)
  })

  it('calls onDeleted and closes dialog on success', async () => {
    mockDeleteConversation.mockResolvedValue({ success: true })

    const { props } = renderDialog()

    await act(async () => {
      fireEvent.click(screen.getByText('deleteSubmit'))
    })

    expect(props.onDeleted).toHaveBeenCalled()
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error message on failure', async () => {
    mockDeleteConversation.mockResolvedValue({
      success: false,
      error: 'delete_failed',
    })

    renderDialog()

    await act(async () => {
      fireEvent.click(screen.getByText('deleteSubmit'))
    })

    expect(screen.getByText('deleteError')).toBeInTheDocument()
  })

  it('does not call onDeleted on failure', async () => {
    mockDeleteConversation.mockResolvedValue({
      success: false,
      error: 'delete_failed',
    })

    const { props } = renderDialog()

    await act(async () => {
      fireEvent.click(screen.getByText('deleteSubmit'))
    })

    expect(props.onDeleted).not.toHaveBeenCalled()
  })

  it('calls onOpenChange(false) when cancel is clicked', () => {
    const { props } = renderDialog()

    // "deleteCancel" appears in both the ghost Button and the sr-only close label.
    // Target the ghost variant via data-variant attribute.
    const cancelButtons = screen.getAllByRole('button', {
      name: 'deleteCancel',
    })
    const ghostCancel = cancelButtons.find(
      (btn) => btn.getAttribute('data-variant') === 'ghost'
    )!
    fireEvent.click(ghostCancel)

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})

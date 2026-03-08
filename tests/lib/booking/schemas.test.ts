import { describe, it, expect } from 'vitest'
import { bookingFormSchema, cancelBookingSchema } from '@/lib/booking/schemas'

describe('bookingFormSchema', () => {
  const validInput = {
    meetingType: 'intro' as const,
    date: '2026-04-15',
    timeSlot: '10:00',
    timezone: 'Europe/Paris',
    name: 'John Doe',
    email: 'john@example.com',
  }

  it('accepts valid input', () => {
    const result = bookingFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts valid input with optional fields', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      message: 'Looking forward to it',
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid meeting type', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      meetingType: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding max length', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      name: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects message exceeding max length', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      message: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      name: '   ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid timezone', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      timezone: 'Not/A/Timezone',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid IANA timezone', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      timezone: 'America/New_York',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date format', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      date: '15-04-2026',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid time slot format', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      timeSlot: '10:00:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects out-of-range hours in time slot', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      timeSlot: '25:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects out-of-range minutes in time slot', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      timeSlot: '10:61',
    })
    expect(result.success).toBe(false)
  })

  it('accepts edge time slots', () => {
    expect(
      bookingFormSchema.safeParse({ ...validInput, timeSlot: '00:00' }).success
    ).toBe(true)
    expect(
      bookingFormSchema.safeParse({ ...validInput, timeSlot: '23:59' }).success
    ).toBe(true)
  })

  it('rejects invalid conversationId', () => {
    const result = bookingFormSchema.safeParse({
      ...validInput,
      conversationId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('cancelBookingSchema', () => {
  it('accepts valid input', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'john@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: 'not-a-uuid',
      email: 'john@example.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = cancelBookingSchema.safeParse({
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })
})

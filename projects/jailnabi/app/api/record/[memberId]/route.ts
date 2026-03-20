import { NextResponse } from 'next/server'
import { isValidMemberId, getMember } from '@/lib/members'
import { getRecord, getConvictions, getConfessions } from '@/lib/record-manager'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params

  if (!isValidMemberId(memberId)) {
    return NextResponse.json({ error: 'Unknown member' }, { status: 404 })
  }

  const member = getMember(memberId)
  const [record, convictions, confessions] = await Promise.all([
    getRecord(memberId),
    getConvictions(memberId),
    getConfessions(memberId),
  ])

  return NextResponse.json({
    member,
    record,
    convictions,
    confessions,
  })
}

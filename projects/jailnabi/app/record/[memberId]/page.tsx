'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CriminalRecord } from '@/components/criminal-record'
import { BASE_PATH } from '@/lib/constants'
import type {
  Member,
  CriminalRecord as CriminalRecordType,
  ConvictionEntry,
  Confession,
} from '@/lib/types'

interface RecordData {
  member: Member
  record: CriminalRecordType
  convictions: ConvictionEntry[]
  confessions: Confession[]
}

export default function RecordPage() {
  const params = useParams<{ memberId: string }>()
  const [data, setData] = useState<RecordData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`${BASE_PATH}/api/record/${params.memberId}`)
        if (!res.ok) throw new Error('Failed to load record')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecord()
  }, [params.memberId])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="card animate-pulse p-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-surface-hover" />
          <div className="mt-4 mx-auto h-6 w-40 rounded bg-surface-hover" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-lg text-danger">{error ?? 'Record not found'}</p>
        <Link href="/" className="btn btn-primary mt-4 inline-flex">
          Back to The Yard
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back to The Yard
      </Link>
      <CriminalRecord
        member={data.member}
        record={data.record}
        convictions={data.convictions}
        confessions={data.confessions}
      />
    </div>
  )
}

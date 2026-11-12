import type { Metadata } from 'next'
import { SupportContent } from '@/components/support-content'
import { PUBLIC_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Support — Prompt Wars',
  description: 'Help cover AI costs for Prompt Wars — voluntary, always free',
  alternates: { canonical: `${PUBLIC_URL}/support` },
}

export default function SupportPage() {
  return <SupportContent />
}

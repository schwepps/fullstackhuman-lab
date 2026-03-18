import type { Metadata } from 'next'
import { SupportContent } from '@/components/support-content'

export const metadata: Metadata = {
  title: 'Support — Prompt Wars',
  description: 'Help cover AI costs for Prompt Wars — voluntary, always free',
}

export default function SupportPage() {
  return <SupportContent />
}

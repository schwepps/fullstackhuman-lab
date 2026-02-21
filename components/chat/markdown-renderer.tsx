'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { CALENDLY_URL_PATTERN } from '@/lib/constants/analytics'

const remarkPlugins = [remarkGfm]

const staticComponents: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="terminal-text-glow mb-4 mt-6 text-xl font-bold text-primary sm:text-2xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-lg font-semibold text-primary sm:text-xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-primary/90">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-foreground/90">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="text-accent italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-4 text-foreground/70 italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="rounded bg-primary/10 px-1 py-0.5 font-mono text-sm text-primary">
          {children}
        </code>
      )
    }
    return (
      <code className="block overflow-x-auto rounded bg-background/50 p-3 font-mono text-sm">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded border border-border bg-background/50 p-4">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-primary/20 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-primary/20 px-3 py-2 text-left font-semibold text-primary">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-primary/20 px-3 py-2 text-foreground/80">
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-border" />,
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { trackCalendlyClick } = useAnalytics()

  const components = useMemo<Components>(
    () => ({
      ...staticComponents,
      a: ({ href, children }) => {
        if (href && !/^https?:\/\//i.test(href)) {
          return <span>{children}</span>
        }
        const isCalendly = href?.includes(CALENDLY_URL_PATTERN) ?? false
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline transition-colors hover:text-accent"
            onClick={
              isCalendly
                ? () => trackCalendlyClick({ source: 'report' })
                : undefined
            }
          >
            {children}
          </a>
        )
      },
    }),
    [trackCalendlyClick]
  )

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {content}
    </ReactMarkdown>
  )
}

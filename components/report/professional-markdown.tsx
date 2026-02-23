import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const remarkPlugins = [remarkGfm]

/**
 * Accent color class mapping for persona-specific styling.
 * Uses darker variants for WCAG AA contrast on white backgrounds.
 */
const ACCENT_CLASSES: Record<
  string,
  { text: string; border: string; bg: string; strong: string }
> = {
  cyan: {
    text: 'text-cyan-700',
    border: 'border-cyan-700',
    bg: 'bg-cyan-50',
    strong: 'text-cyan-800',
  },
  amber: {
    text: 'text-amber-700',
    border: 'border-amber-700',
    bg: 'bg-amber-50',
    strong: 'text-amber-800',
  },
  emerald: {
    text: 'text-emerald-700',
    border: 'border-emerald-700',
    bg: 'bg-emerald-50',
    strong: 'text-emerald-800',
  },
}

function buildComponents(accentColor: string): Components {
  const accent = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.cyan

  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-6 text-2xl font-bold text-gray-900">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={`mb-3 mt-6 text-lg font-semibold ${accent.text}`}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-base font-semibold text-gray-800">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-gray-700">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className={`font-semibold ${accent.strong}`}>{children}</strong>
    ),
    em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-gray-700">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-gray-700">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote
        className={`my-3 border-l-3 ${accent.border} pl-4 text-gray-600 italic`}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">
            {children}
          </code>
        )
      }
      return (
        <code className="block overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
          {children}
        </code>
      )
    },
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-4">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className={accent.bg}>{children}</thead>,
    th: ({ children }) => (
      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-900">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-200 px-3 py-2 text-sm text-gray-700">
        {children}
      </td>
    ),
    hr: () => <hr className="my-6 border-gray-200" />,
    a: ({ href, children }) => {
      if (href && !/^https?:\/\//i.test(href)) {
        return <span>{children}</span>
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${accent.text} underline underline-offset-2`}
        >
          {children}
        </a>
      )
    },
  }
}

interface ProfessionalMarkdownProps {
  content: string
  accentColor: string
}

export function ProfessionalMarkdown({
  content,
  accentColor,
}: ProfessionalMarkdownProps) {
  const components = buildComponents(accentColor)

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {content}
    </ReactMarkdown>
  )
}

/**
 * JSON-LD structured data components for SEO and GEO optimization.
 * Wraps schema.org structured data for easy inclusion in pages.
 *
 * WARNING: Only pass trusted, hardcoded data — never user input.
 * The \u003c escape prevents script tag breakout if data is ever dynamic.
 */

interface JsonLdProps {
  data: Record<string, unknown>
}

function safeStringify(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  )
}

interface MultiJsonLdProps {
  schemas: Array<Record<string, unknown>>
}

export function MultiJsonLd({ schemas }: MultiJsonLdProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStringify(schema) }}
        />
      ))}
    </>
  )
}

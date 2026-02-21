import { Separator } from '@/components/ui/separator'

interface LegalSection {
  heading: string
  paragraphs: readonly string[]
}

interface LegalPageLayoutProps {
  title: string
  subtitle?: string
  sections: readonly LegalSection[]
}

export function LegalPageLayout({
  title,
  subtitle,
  sections,
}: LegalPageLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header>
        <h1 className="terminal-text-glow font-mono text-2xl font-bold sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 font-mono text-sm text-foreground/40">
            {subtitle}
          </p>
        )}
        <Separator className="mt-4" />
      </header>

      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-primary">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="mt-3 text-sm leading-relaxed text-foreground/70"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  )
}

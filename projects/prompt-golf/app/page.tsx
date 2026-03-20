export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100svh-2.75rem)] flex-col items-center justify-center px-4 pb-safe">
      <div className="mx-auto w-full max-w-2xl text-center">
        {/* Logo / Title */}
        <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-accent/60">
          Est. 2026
        </div>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Prompt Golf
        </h1>
        <div className="gold-divider mx-auto mt-4 w-32" />
        <p className="mt-6 font-serif text-lg text-muted-foreground">
          Describe code in natural language.
          <br />
          <span className="text-accent">Fewest words wins.</span>
        </p>

        {/* Placeholder — course map will go here */}
        <div className="mt-12 text-sm text-muted-foreground">
          Course map loading...
        </div>
      </div>
    </div>
  )
}

import { ANNOUNCEMENTS } from '@/lib/announcements'

export function StateAnnouncements() {
  const decrees = ANNOUNCEMENTS.filter((a) => a.type === 'decree')
  const metrics = ANNOUNCEMENTS.filter((a) => a.type === 'metric')
  const reminders = ANNOUNCEMENTS.filter((a) => a.type === 'reminder')
  const slogans = ANNOUNCEMENTS.filter((a) => a.type === 'slogan')

  return (
    <aside className="space-y-5">
      {/* Header */}
      <div
        className="bg-primary px-4 py-3 text-center"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground whitespace-nowrap">
          ★ Communiqués du Parti ★
        </h2>
      </div>

      {/* Date */}
      <div className="text-center text-xs text-gold uppercase tracking-wider px-4">
        An 3 de la Glorieuse Révolution Numérique
      </div>

      {/* Metrics */}
      <div className="space-y-3 px-4">
        {metrics.map((m) => (
          <div
            key={m.id}
            className="bg-surface border border-border/30 p-3 text-center"
          >
            <div
              className="text-[10px] uppercase tracking-wider text-muted mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {m.content}
            </div>
            <div
              className="text-2xl font-bold text-gold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="gold-line mx-4" />

      {/* Decrees */}
      <div className="space-y-3 px-4">
        <h3
          className="text-xs font-bold uppercase tracking-wider text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Décrets en vigueur
        </h3>
        {decrees.map((d) => (
          <div
            key={d.id}
            className="border-l-2 border-primary/40 pl-3 text-sm text-foreground/70 leading-relaxed"
          >
            {d.content}
          </div>
        ))}
      </div>

      <div className="gold-line mx-4" />

      {/* Reminders */}
      <div className="space-y-3 px-4">
        <h3
          className="text-xs font-bold uppercase tracking-wider text-gold"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Rappels officiels
        </h3>
        {reminders.map((r) => (
          <div
            key={r.id}
            className="bg-surface/50 border border-gold/20 p-3 text-sm text-foreground/60 leading-relaxed"
          >
            ⚠ {r.content}
          </div>
        ))}
      </div>

      <div className="gold-line mx-4" />

      {/* Slogan */}
      {slogans.map((s) => (
        <div
          key={s.id}
          className="px-4 py-3 text-center italic text-gold/80 text-sm"
        >
          &laquo; {s.content} &raquo;
        </div>
      ))}
    </aside>
  )
}

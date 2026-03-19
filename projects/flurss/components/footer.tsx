export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/30 bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center space-y-3">
        {/* Approval stamp */}
        <div
          className="text-xs uppercase tracking-[0.15em] text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ★ Approuvé par le Ministère de la Vérité Numérique ★
        </div>

        <div className="gold-line max-w-xs mx-auto" />

        {/* Slogans */}
        <p className="text-sm text-foreground/50 italic">
          &laquo; L&apos;information est une arme. Maniez-la avec le Parti.
          &raquo;
        </p>

        {/* Legal */}
        <div className="text-[10px] text-muted/60 space-y-1">
          <p>
            FlURSS &mdash; Fédération Libre et Unifiée des Républiques
            Socialistes du Signal &mdash; {year}
          </p>
          <p>
            Sinews est une création humoristique de{' '}
            <a
              href="https://fullstackhuman.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/60 hover:text-gold transition-colors"
            >
              FullStackHuman
            </a>
            . Aucun flux RSS n&apos;a été maltraité.
          </p>
        </div>
      </div>
    </footer>
  )
}

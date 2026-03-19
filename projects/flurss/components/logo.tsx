export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 440 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-label="Sinews — Agence de presse officielle du FlURSS"
        role="img"
      >
        {/* Red star with RSS signal — vertically centered with SINEWS */}
        <g transform="translate(32, 35)">
          <polygon
            points="0,-24 5.5,-7.5 23,-7.5 9,3 14,20 0,10 -14,20 -9,3 -23,-7.5 -5.5,-7.5"
            fill="#cc0000"
            stroke="#d4a017"
            strokeWidth="0.8"
          />
          <circle cx="0" cy="2" r="2.5" fill="#d4a017" />
          <path
            d="M0-3.5a5.5 5.5 0 0 1 5.5 5.5"
            fill="none"
            stroke="#d4a017"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M0-7.5a9.5 9.5 0 0 1 9.5 9.5"
            fill="none"
            stroke="#d4a017"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>

        {/* SINEWS title — bigger, aligned with star center */}
        <text
          x="70"
          y="48"
          textAnchor="start"
          fontFamily="Oswald, Impact, sans-serif"
          fontWeight="700"
          fontSize="54"
          letterSpacing="10"
          fill="#f5e6d0"
        >
          SINEWS
        </text>

        {/* Gold decorative line */}
        <line
          x1="70"
          y1="58"
          x2="370"
          y2="58"
          stroke="#d4a017"
          strokeWidth="1.5"
        />
        <line
          x1="70"
          y1="61"
          x2="370"
          y2="61"
          stroke="#cc0000"
          strokeWidth="0.5"
        />

        {/* Tagline with inline stars */}
        <text
          x="70"
          y="78"
          textAnchor="start"
          fontFamily="Oswald, Impact, sans-serif"
          fontWeight="400"
          fontSize="11"
          letterSpacing="3.5"
          fill="#d4a017"
        >
          <tspan fill="#cc0000">★</tspan>
          {' AGENCE DE PRESSE OFFICIELLE DU FlURSS '}
          <tspan fill="#cc0000">★</tspan>
        </text>
      </svg>
    </div>
  )
}

import type { RootCauseFlowData } from '@/lib/visuals/types'

interface RootCauseFlowProps {
  data: RootCauseFlowData
  accentHex: string
}

export function RootCauseFlow({ data, accentHex }: RootCauseFlowProps) {
  const rows = data.rows

  return (
    <div
      role="img"
      aria-label="Symptoms and root causes flow diagram"
      className="mx-auto max-w-2xl font-mono"
    >
      {/* Column headers — visible only on lg+ (side-by-side mode) */}
      <div className="mb-3 hidden lg:grid lg:grid-cols-[1fr_40px_1fr]">
        <p className="text-center text-xs uppercase tracking-wider text-gray-400">
          Symptom
        </p>
        <div />
        <p
          className="text-center text-xs uppercase tracking-wider"
          style={{ color: accentHex }}
        >
          Root Cause
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-5 lg:space-y-4">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col items-stretch gap-2 lg:grid lg:grid-cols-[1fr_40px_1fr] lg:items-center lg:gap-0"
          >
            {/* Symptom card */}
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
              {/* Mobile/md label */}
              <span className="mb-1 block text-xs uppercase tracking-wider text-gray-400 lg:hidden">
                Symptom
              </span>
              <p className="text-center text-xs text-gray-700">{row.symptom}</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              {/* Down arrow on mobile/md */}
              <svg
                className="h-5 w-5 text-gray-400 lg:hidden"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 15l-5-5h3V5h4v5h3l-5 5z" />
              </svg>
              {/* Right arrow on lg+ */}
              <svg
                className="hidden h-4 w-8 text-gray-400 lg:block"
                viewBox="0 0 32 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <line x1={0} y1={8} x2={24} y2={8} strokeDasharray="4 3" />
                <path d="M24 8l-5-4v8l5-4z" fill="currentColor" />
              </svg>
            </div>

            {/* Root cause card */}
            <div
              className="rounded border px-3 py-2"
              style={{
                backgroundColor: `${accentHex}10`,
                borderColor: `${accentHex}4D`,
              }}
            >
              {/* Mobile/md label */}
              <span
                className="mb-1 block text-xs uppercase tracking-wider lg:hidden"
                style={{ color: accentHex }}
              >
                Root Cause
              </span>
              <p
                className="text-center text-xs font-medium"
                style={{ color: accentHex }}
              >
                {row.rootCause}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

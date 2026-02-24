import { describe, it, expect } from 'vitest'
import {
  polarToCartesian,
  arcPath,
  donutArcPath,
  gaugeNeedleAngle,
  gaugeNeedlePoint,
  gaugeSegments,
  radarPolygonPoints,
  radarGridPoints,
  pointsToSvgString,
  matrixDotPosition,
  quadrantBounds,
  frameworkUserPosition,
  spectrumTickX,
  arrowheadPath,
  RISK_LEVEL_FRACTIONS,
} from '@/lib/visuals/geometry'

// ─── Helpers ───

/**
 * Extract the large-arc-flag from an SVG arc path string.
 * Format: M x y A rx ry rotation large-arc-flag sweep-flag x y
 * The A command parameters are: rx ry x-rotation large-arc-flag sweep-flag x y
 */
function extractLargeArcFlag(pathStr: string): string {
  // Match the A command parameters
  const match = pathStr.match(
    /A\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+([\d.]+)\s+[\d.]+\s+/
  )
  return match ? match[1] : ''
}

// ─── Polar / Cartesian Conversion ───

describe('polarToCartesian', () => {
  const cx = 100
  const cy = 100
  const r = 50

  it.each([
    {
      angle: 0,
      desc: "0 deg (top / 12 o'clock)",
      expectedX: 100,
      expectedY: 50,
    },
    {
      angle: 90,
      desc: "90 deg (right / 3 o'clock)",
      expectedX: 150,
      expectedY: 100,
    },
    {
      angle: 180,
      desc: "180 deg (bottom / 6 o'clock)",
      expectedX: 100,
      expectedY: 150,
    },
    {
      angle: 270,
      desc: "270 deg (left / 9 o'clock)",
      expectedX: 50,
      expectedY: 100,
    },
    {
      angle: 360,
      desc: '360 deg (same as 0 deg)',
      expectedX: 100,
      expectedY: 50,
    },
  ])(
    'returns correct cartesian coordinates at $desc',
    ({ angle, expectedX, expectedY }) => {
      const point = polarToCartesian(cx, cy, r, angle)
      expect(point.x).toBeCloseTo(expectedX, 5)
      expect(point.y).toBeCloseTo(expectedY, 5)
    }
  )

  it('returns center when radius is 0', () => {
    const point = polarToCartesian(cx, cy, 0, 45)
    expect(point.x).toBeCloseTo(cx, 5)
    expect(point.y).toBeCloseTo(cy, 5)
  })

  it('returns correct point at 45 degrees', () => {
    const point = polarToCartesian(cx, cy, r, 45)
    // 45 deg in this coordinate system: angleRad = (45-90)*PI/180 = -45 deg
    // x = cx + r*cos(-45) = 100 + 50 * (sqrt(2)/2) ~ 135.36
    // y = cy + r*sin(-45) = 100 + 50 * (-sqrt(2)/2) ~ 64.64
    const cos45 = Math.cos((-45 * Math.PI) / 180)
    const sin45 = Math.sin((-45 * Math.PI) / 180)
    expect(point.x).toBeCloseTo(cx + r * cos45, 5)
    expect(point.y).toBeCloseTo(cy + r * sin45, 5)
  })
})

// ─── SVG Arc Paths ───

describe('arcPath', () => {
  it('returns a valid SVG path string with M and A commands', () => {
    const result = arcPath(100, 100, 50, 0, 90)
    expect(result).toContain('M ')
    expect(result).toContain(' A ')
  })

  it('sets largeArc flag to 0 for arcs <= 180 degrees', () => {
    const result = arcPath(100, 100, 50, 0, 90)
    expect(extractLargeArcFlag(result)).toBe('0')
  })

  it('sets largeArc flag to 1 for arcs > 180 degrees', () => {
    const result = arcPath(100, 100, 50, 0, 270)
    expect(extractLargeArcFlag(result)).toBe('1')
  })

  it('produces a semicircle (largeArc = 0) for exactly 180 degrees', () => {
    const result = arcPath(100, 100, 50, 0, 180)
    // 180 is not > 180, so largeArc = 0
    expect(extractLargeArcFlag(result)).toBe('0')
  })

  it('uses the specified radius in the A command', () => {
    const r = 42
    const result = arcPath(100, 100, r, 0, 90)
    expect(result).toContain(`A ${r} ${r}`)
  })
})

describe('donutArcPath', () => {
  it('returns a closed path ending with Z', () => {
    const result = donutArcPath(100, 100, 50, 30, 0, 90)
    expect(result).toMatch(/Z$/)
  })

  it('contains both outer and inner arc commands', () => {
    const result = donutArcPath(100, 100, 50, 30, 0, 90)
    // Should have M, first A (outer), L, second A (inner), Z
    expect(result).toContain('M ')
    // Two A commands for outer and inner arcs
    const arcCount = (result.match(/ A /g) || []).length
    expect(arcCount).toBe(2)
  })

  it('contains a line segment (L) connecting outer to inner arc', () => {
    const result = donutArcPath(100, 100, 50, 30, 0, 90)
    expect(result).toContain(' L ')
  })

  it('uses outer radius for the first arc and inner radius for the second', () => {
    const outerR = 50
    const innerR = 30
    const result = donutArcPath(100, 100, outerR, innerR, 0, 90)
    // First A command uses outerR, second uses innerR
    const arcs = result.match(/A (\d+) (\d+)/g) || []
    expect(arcs[0]).toBe(`A ${outerR} ${outerR}`)
    expect(arcs[1]).toBe(`A ${innerR} ${innerR}`)
  })
})

// ─── Risk Gauge ───

describe('RISK_LEVEL_FRACTIONS', () => {
  it('defines fractions for low, medium, high, critical', () => {
    expect(RISK_LEVEL_FRACTIONS).toHaveProperty('low')
    expect(RISK_LEVEL_FRACTIONS).toHaveProperty('medium')
    expect(RISK_LEVEL_FRACTIONS).toHaveProperty('high')
    expect(RISK_LEVEL_FRACTIONS).toHaveProperty('critical')
  })

  it('fractions are ordered: low < medium < high < critical', () => {
    expect(RISK_LEVEL_FRACTIONS.low).toBeLessThan(RISK_LEVEL_FRACTIONS.medium)
    expect(RISK_LEVEL_FRACTIONS.medium).toBeLessThan(RISK_LEVEL_FRACTIONS.high)
    expect(RISK_LEVEL_FRACTIONS.high).toBeLessThan(
      RISK_LEVEL_FRACTIONS.critical
    )
  })

  it('all fractions are between 0 and 1 exclusive', () => {
    for (const fraction of Object.values(RISK_LEVEL_FRACTIONS)) {
      expect(fraction).toBeGreaterThan(0)
      expect(fraction).toBeLessThan(1)
    }
  })
})

describe('gaugeNeedleAngle', () => {
  it.each([
    { fraction: 0, expected: 270, desc: 'fraction 0 maps to 270 (left)' },
    { fraction: 0.5, expected: 360, desc: 'fraction 0.5 maps to 360 (top)' },
    { fraction: 1, expected: 450, desc: 'fraction 1 maps to 450 (right)' },
    {
      fraction: 0.25,
      expected: 315,
      desc: 'fraction 0.25 maps to 315',
    },
    {
      fraction: 0.75,
      expected: 405,
      desc: 'fraction 0.75 maps to 405',
    },
  ])('$desc', ({ fraction, expected }) => {
    expect(gaugeNeedleAngle(fraction)).toBeCloseTo(expected, 5)
  })

  it('maps risk level fractions to within the gauge arc', () => {
    for (const fraction of Object.values(RISK_LEVEL_FRACTIONS)) {
      const angle = gaugeNeedleAngle(fraction)
      expect(angle).toBeGreaterThanOrEqual(270)
      expect(angle).toBeLessThanOrEqual(450)
    }
  })
})

describe('gaugeNeedlePoint', () => {
  const cx = 100
  const cy = 100
  const r = 80

  it('returns a point on the left at fraction 0', () => {
    const point = gaugeNeedlePoint(cx, cy, r, 0)
    // fraction 0 -> angle 270
    // angleRad = (270-90)*PI/180 = PI
    // x = 100 + 80*cos(PI) = 20, y = 100 + 80*sin(PI) ~ 100
    expect(point.x).toBeCloseTo(20, 5)
    expect(point.y).toBeCloseTo(100, 5)
  })

  it('returns a point on the right at fraction 1', () => {
    const point = gaugeNeedlePoint(cx, cy, r, 1)
    // fraction 1 -> angle 450 -> same as 90 deg
    // angleRad = (450-90)*PI/180 = 2*PI
    // x = 100 + 80*cos(2PI) = 180, y = 100 + 80*sin(2PI) ~ 100
    expect(point.x).toBeCloseTo(180, 5)
    expect(point.y).toBeCloseTo(100, 5)
  })

  it('returns a point at the expected angle for fraction 0.5', () => {
    const point = gaugeNeedlePoint(cx, cy, r, 0.5)
    // fraction 0.5 -> angle 360 -> same as 0 deg
    // angleRad = (360-90)*PI/180 = 3PI/2
    // x = 100 + 80*cos(3PI/2) ~ 100, y = 100 + 80*sin(3PI/2) = 20
    expect(point.x).toBeCloseTo(100, 5)
    expect(point.y).toBeCloseTo(20, 5)
  })
})

describe('gaugeSegments', () => {
  it('returns exactly 4 segments', () => {
    expect(gaugeSegments()).toHaveLength(4)
  })

  it('covers the full 270 to 450 range', () => {
    const segments = gaugeSegments()
    expect(segments[0].startAngle).toBe(270)
    expect(segments[segments.length - 1].endAngle).toBe(450)
  })

  it('has contiguous segments with no gaps', () => {
    const segments = gaugeSegments()
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].startAngle).toBe(segments[i - 1].endAngle)
    }
  })

  it('labels segments as low, medium, high, critical in order', () => {
    const segments = gaugeSegments()
    expect(segments.map((s) => s.level)).toEqual([
      'low',
      'medium',
      'high',
      'critical',
    ])
  })

  it('each segment spans 45 degrees (180 / 4)', () => {
    const segments = gaugeSegments()
    for (const seg of segments) {
      expect(seg.endAngle - seg.startAngle).toBe(45)
    }
  })
})

// ─── Radar / Spider Chart ───

describe('radarPolygonPoints', () => {
  const cx = 100
  const cy = 100
  const maxScore = 10
  const outerRadius = 80

  it('returns one point per score', () => {
    const scores = [5, 7, 3, 9, 6]
    const points = radarPolygonPoints(cx, cy, scores, maxScore, outerRadius)
    expect(points).toHaveLength(5)
  })

  it('returns empty array for empty scores', () => {
    expect(radarPolygonPoints(cx, cy, [], maxScore, outerRadius)).toEqual([])
  })

  it('places max score at the outer radius', () => {
    // Single score at max -> should be at distance outerRadius from center
    const points = radarPolygonPoints(cx, cy, [10], maxScore, outerRadius)
    const p = points[0]
    const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
    expect(dist).toBeCloseTo(outerRadius, 5)
  })

  it('places zero score at the center', () => {
    const points = radarPolygonPoints(cx, cy, [0], maxScore, outerRadius)
    expect(points[0].x).toBeCloseTo(cx, 5)
    expect(points[0].y).toBeCloseTo(cy, 5)
  })

  it('distributes points evenly around the circle', () => {
    // 4 equal scores -> points should be at 0, 90, 180, 270 degrees
    const scores = [5, 5, 5, 5]
    const points = radarPolygonPoints(cx, cy, scores, maxScore, outerRadius)
    const expectedR = (5 / 10) * 80 // 40
    // Point 0: 0 deg (top)
    expect(points[0].x).toBeCloseTo(cx, 5)
    expect(points[0].y).toBeCloseTo(cy - expectedR, 5)
    // Point 1: 90 deg (right)
    expect(points[1].x).toBeCloseTo(cx + expectedR, 5)
    expect(points[1].y).toBeCloseTo(cy, 5)
    // Point 2: 180 deg (bottom)
    expect(points[2].x).toBeCloseTo(cx, 5)
    expect(points[2].y).toBeCloseTo(cy + expectedR, 5)
    // Point 3: 270 deg (left)
    expect(points[3].x).toBeCloseTo(cx - expectedR, 5)
    expect(points[3].y).toBeCloseTo(cy, 5)
  })
})

describe('radarGridPoints', () => {
  it('returns correct number of points for given dimensions', () => {
    const points = radarGridPoints(100, 100, 80, 5)
    expect(points).toHaveLength(5)
  })

  it('all points are at the specified radius from center', () => {
    const cx = 100
    const cy = 100
    const r = 60
    const points = radarGridPoints(cx, cy, r, 6)
    for (const p of points) {
      const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
      expect(dist).toBeCloseTo(r, 5)
    }
  })

  it("first point is at top (12 o'clock)", () => {
    const cx = 100
    const cy = 100
    const r = 50
    const points = radarGridPoints(cx, cy, r, 4)
    // 0 deg -> top -> (cx, cy - r)
    expect(points[0].x).toBeCloseTo(cx, 5)
    expect(points[0].y).toBeCloseTo(cy - r, 5)
  })
})

describe('pointsToSvgString', () => {
  it('formats points as comma-separated x,y pairs joined by spaces', () => {
    const result = pointsToSvgString([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ])
    expect(result).toBe('10,20 30,40 50,60')
  })

  it('returns empty string for empty array', () => {
    expect(pointsToSvgString([])).toBe('')
  })

  it('returns single pair for one point', () => {
    expect(pointsToSvgString([{ x: 5, y: 10 }])).toBe('5,10')
  })
})

// ─── Action Priority Matrix ───

describe('matrixDotPosition', () => {
  const plotX = 40
  const plotY = 20
  const plotWidth = 200
  const plotHeight = 200
  const maxScore = 10

  it('maps origin (0,0) to bottom-left of plot area', () => {
    const point = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      0,
      0,
      maxScore
    )
    expect(point.x).toBeCloseTo(plotX, 5)
    expect(point.y).toBeCloseTo(plotY + plotHeight, 5)
  })

  it('maps max scores to top-right of plot area', () => {
    const point = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      maxScore,
      maxScore,
      maxScore
    )
    expect(point.x).toBeCloseTo(plotX + plotWidth, 5)
    expect(point.y).toBeCloseTo(plotY, 5)
  })

  it('maps mid-point scores to center of plot area', () => {
    const point = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      5,
      5,
      maxScore
    )
    expect(point.x).toBeCloseTo(plotX + plotWidth / 2, 5)
    expect(point.y).toBeCloseTo(plotY + plotHeight / 2, 5)
  })

  it('higher impact moves point upward (lower y)', () => {
    const low = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      2,
      5,
      maxScore
    )
    const high = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      8,
      5,
      maxScore
    )
    expect(high.y).toBeLessThan(low.y)
  })

  it('higher urgency moves point rightward (higher x)', () => {
    const low = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      5,
      2,
      maxScore
    )
    const high = matrixDotPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      5,
      8,
      maxScore
    )
    expect(high.x).toBeGreaterThan(low.x)
  })
})

// ─── Framework Matrix (2x2 Quadrant) ───

describe('quadrantBounds', () => {
  const plotX = 40
  const plotY = 20
  const plotWidth = 200
  const plotHeight = 160

  it('returns exactly 4 quadrants', () => {
    const bounds = quadrantBounds(plotX, plotY, plotWidth, plotHeight)
    expect(Object.keys(bounds)).toHaveLength(4)
    expect(bounds).toHaveProperty('topLeft')
    expect(bounds).toHaveProperty('topRight')
    expect(bounds).toHaveProperty('bottomLeft')
    expect(bounds).toHaveProperty('bottomRight')
  })

  it('quadrants fill the entire plot area without overlap', () => {
    const bounds = quadrantBounds(plotX, plotY, plotWidth, plotHeight)
    const halfW = plotWidth / 2
    const halfH = plotHeight / 2

    // Top-left starts at plot origin
    expect(bounds.topLeft.x).toBe(plotX)
    expect(bounds.topLeft.y).toBe(plotY)
    expect(bounds.topLeft.width).toBe(halfW)
    expect(bounds.topLeft.height).toBe(halfH)

    // Top-right starts at horizontal midpoint
    expect(bounds.topRight.x).toBe(plotX + halfW)
    expect(bounds.topRight.y).toBe(plotY)

    // Bottom-left starts at vertical midpoint
    expect(bounds.bottomLeft.x).toBe(plotX)
    expect(bounds.bottomLeft.y).toBe(plotY + halfH)

    // Bottom-right starts at both midpoints
    expect(bounds.bottomRight.x).toBe(plotX + halfW)
    expect(bounds.bottomRight.y).toBe(plotY + halfH)
  })

  it('each quadrant has correct center coordinates', () => {
    const bounds = quadrantBounds(plotX, plotY, plotWidth, plotHeight)
    const halfW = plotWidth / 2
    const halfH = plotHeight / 2

    expect(bounds.topLeft.centerX).toBe(plotX + halfW / 2)
    expect(bounds.topLeft.centerY).toBe(plotY + halfH / 2)

    expect(bounds.bottomRight.centerX).toBe(plotX + halfW + halfW / 2)
    expect(bounds.bottomRight.centerY).toBe(plotY + halfH + halfH / 2)
  })
})

describe('frameworkUserPosition', () => {
  const plotX = 40
  const plotY = 20
  const plotWidth = 200
  const plotHeight = 160

  it('maps (0, 0) to bottom-left corner', () => {
    const point = frameworkUserPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      0,
      0
    )
    expect(point.x).toBeCloseTo(plotX, 5)
    expect(point.y).toBeCloseTo(plotY + plotHeight, 5)
  })

  it('maps (1, 1) to top-right corner', () => {
    const point = frameworkUserPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      1,
      1
    )
    expect(point.x).toBeCloseTo(plotX + plotWidth, 5)
    expect(point.y).toBeCloseTo(plotY, 5)
  })

  it('maps (0.5, 0.5) to center', () => {
    const point = frameworkUserPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      0.5,
      0.5
    )
    expect(point.x).toBeCloseTo(plotX + plotWidth / 2, 5)
    expect(point.y).toBeCloseTo(plotY + plotHeight / 2, 5)
  })

  it('higher yFraction moves point upward (lower y pixel value)', () => {
    const low = frameworkUserPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      0.5,
      0.2
    )
    const high = frameworkUserPosition(
      plotX,
      plotY,
      plotWidth,
      plotHeight,
      0.5,
      0.8
    )
    expect(high.y).toBeLessThan(low.y)
  })
})

// ─── Concept Spectrum ───

describe('spectrumTickX', () => {
  it.each([
    { fraction: 0, expected: 20, desc: 'fraction 0 returns startX' },
    {
      fraction: 1,
      expected: 220,
      desc: 'fraction 1 returns startX + trackWidth',
    },
    { fraction: 0.5, expected: 120, desc: 'fraction 0.5 returns midpoint' },
    {
      fraction: 0.25,
      expected: 70,
      desc: 'fraction 0.25 returns quarter point',
    },
  ])('$desc', ({ fraction, expected }) => {
    expect(spectrumTickX(20, 200, fraction)).toBeCloseTo(expected, 5)
  })

  it('is a linear interpolation', () => {
    const startX = 10
    const trackWidth = 300
    // Two points at 0.3 and 0.6 should have exactly double the distance from startX
    const a = spectrumTickX(startX, trackWidth, 0.3)
    const b = spectrumTickX(startX, trackWidth, 0.6)
    expect(b - startX).toBeCloseTo(2 * (a - startX), 5)
  })
})

// ─── SVG Arrowhead ───

describe('arrowheadPath', () => {
  it('returns a valid SVG path with M, L, L, Z commands', () => {
    const result = arrowheadPath(100, 50, 10)
    expect(result).toMatch(/^M /)
    expect(result).toMatch(/Z$/)
    // Should have exactly 2 L commands
    const lCount = (result.match(/ L /g) || []).length
    expect(lCount).toBe(2)
  })

  it('tip of arrowhead is at the specified (tipX, tipY)', () => {
    const tipX = 150
    const tipY = 75
    const result = arrowheadPath(tipX, tipY, 10)
    // First command: M tipX tipY
    expect(result).toContain(`M ${tipX} ${tipY}`)
  })

  it('base points are offset by size from the tip', () => {
    const tipX = 100
    const tipY = 50
    const size = 12
    const result = arrowheadPath(tipX, tipY, size)

    // L tipX-size tipY-size/2  and  L tipX-size tipY+size/2
    expect(result).toContain(`L ${tipX - size} ${tipY - size / 2}`)
    expect(result).toContain(`L ${tipX - size} ${tipY + size / 2}`)
  })

  it('produces a zero-area path when size is 0', () => {
    const result = arrowheadPath(100, 50, 0)
    // All three points collapse to (100, 50)
    expect(result).toBe('M 100 50 L 100 50 L 100 50 Z')
  })
})

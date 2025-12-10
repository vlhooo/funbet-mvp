"use client"

import { useMemo } from "react"

interface ChartProps {
  visiblePrices: number[]
  betDirection: "UP" | "DOWN" | null
  entryPrice: number | null
  isActive: boolean
  updatesCount: number
  isWon: boolean | null
  isFrozen: boolean
}

export default function Chart({ visiblePrices, betDirection, entryPrice, isActive, updatesCount, isWon, isFrozen }: ChartProps) {
  const { points, width, height, padding, slotWidth } = useMemo(() => {
    // Fixed layout
    const width = 1000
    const height = 600
    const padding = { top: 20, right: 20, bottom: 20, left: 20 }
    
    // 20 columns means 19 segments? Or 20 slots?
    // "Fixed 20 columns". Let's assume 20 points X-coordinates.
    // Indices 0..19.
    const totalSlots = 20
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const slotWidth = chartWidth / (totalSlots - 1)

    const minY = 0
    const maxY = 400

    // Map the 13 visible prices to the first 13 slots (indices 0..12)
    const points = visiblePrices.map((price, index) => {
      const x = padding.left + index * slotWidth
      const y = padding.top + chartHeight - ((price - minY) / (maxY - minY)) * chartHeight
      return { x, y, price }
    })

    return {
      points,
      width,
      height,
      padding,
      slotWidth
    }
  }, [visiblePrices])

  const chartHeight = height - padding.top - padding.bottom
  
  // Entry Line Y Position
  const entryY =
    entryPrice !== null
      ? padding.top + chartHeight * (1 - entryPrice / 400)
      : 0

  // Generate SVG path for the visible line (13 points)
  const pathData = points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

  const betLineColor = betDirection === "UP" ? "#22c55e" : betDirection === "DOWN" ? "#ef4444" : null

  // Guide Lines
  const guideLineCount = 4
  const guideLines = Array.from({ length: guideLineCount }, (_, i) => {
    const yPosition = padding.top + (chartHeight / (guideLineCount + 1)) * (i + 1)
    return yPosition
  })

  // Target Line Logic (Moving Left)
  // At start (updatesCount = 0), we want the target to be 10 slots to the right of "current head" (index 12).
  // Target index = 12 + 10 - updatesCount
  const ticksRemaining = 10 - updatesCount
  const targetIndex = 12 + ticksRemaining
  
  const targetX = padding.left + targetIndex * slotWidth
  const isTargetVisible = isActive && targetIndex <= 19 && targetIndex >= 12
  
  // Opacity/Glow based on progress
  const targetOpacity = isActive ? 0.4 + (0.6 * (1 - ticksRemaining / 10)) : 0
  
  const upGradientId = "upGradient"
  const downGradientId = "downGradient"

  // Final Result Dot Logic
  const showResultDot = isFrozen && isWon !== null
  const resultColor = isWon ? "#22c55e" : "#ef4444" // Green or Red

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full select-none"
    >
      <style jsx>{`
        @keyframes growLine {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseGradient {
          0% { opacity: 0.6; }
          50% { opacity: 0.85; }
          100% { opacity: 0.6; }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glowPulse {
          0% { filter: drop-shadow(0 0 2px currentColor); }
          50% { filter: drop-shadow(0 0 15px currentColor); }
          100% { filter: drop-shadow(0 0 5px currentColor); }
        }
        .entry-line-animate {
          transform-origin: left;
          animation: growLine 0.5s ease-out forwards;
        }
        .bet-gradient-animate {
          animation: fadeIn 0.5s ease-out forwards, pulseGradient 3s ease-in-out infinite 0.5s;
        }
        .bet-gradient-static {
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        .target-hit-glow {
          filter: drop-shadow(0 0 8px currentColor);
          transition: filter 0.3s;
        }
        .result-dot-animate {
          transform-box: fill-box;
          transform-origin: center;
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, glowPulse 2s infinite 0.5s;
        }
      `}</style>
      <defs>
        <linearGradient id={upGradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={downGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Guide Lines */}
      {guideLines.map((yPosition, idx) => (
        <line
          key={`guide-${idx}`}
          x1={padding.left}
          y1={yPosition}
          x2={width - padding.right}
          y2={yPosition}
          stroke="#333"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}

      {/* Target Line (Moving) */}
      {isTargetVisible && (
        <>
          <line
            x1={targetX}
            y1={padding.top}
            x2={targetX}
            y2={height - padding.bottom}
            stroke={ticksRemaining === 0 ? "#eab308" : "#ffffff"}
            strokeWidth={ticksRemaining === 0 ? 3 : 2}
            strokeDasharray={ticksRemaining === 0 ? "0" : "6,4"}
            opacity={targetOpacity}
            className={`transition-all duration-300 ${ticksRemaining === 0 ? "target-hit-glow" : ""}`}
            style={{ 
              transition: "x1 0.5s linear, x2 0.5s linear, stroke 0.3s, stroke-width 0.3s, opacity 0.3s"
            }}
          />
          <text
            x={targetX}
            y={padding.top - 5}
            fill={ticksRemaining === 0 ? "#eab308" : "#ffffff"}
            fontSize="20"
            textAnchor="middle"
            opacity={targetOpacity}
            fontWeight="bold"
            className="transition-all duration-300"
            style={{ 
              transition: "x 0.5s linear, fill 0.3s, opacity 0.3s"
            }}
          >
            {ticksRemaining === 0 ? "Result" : `${ticksRemaining}s`}
          </text>
        </>
      )}

      {/* Background Gradients for Bet */}
      {betDirection === "UP" && entryPrice !== null && (
        <rect
          x={padding.left}
          y={padding.top}
          width={width - padding.left - padding.right}
          height={Math.max(0, entryY - padding.top)}
          fill={`url(#${upGradientId})`}
          className={isActive ? "bet-gradient-animate" : "bet-gradient-static"}
        />
      )}

      {betDirection === "DOWN" && entryPrice !== null && (
        <rect
          x={padding.left}
          y={entryY}
          width={width - padding.left - padding.right}
          height={Math.max(0, height - padding.bottom - entryY)}
          fill={`url(#${downGradientId})`}
          className={isActive ? "bet-gradient-animate" : "bet-gradient-static"}
        />
      )}

      {/* Horizontal Entry Line (Across entire chart) */}
      {entryPrice !== null && betLineColor && (
        <line
          x1={padding.left}
          y1={entryY}
          x2={width - padding.right}
          y2={entryY}
          stroke={betLineColor}
          strokeWidth="2"
          opacity="0.8"
          className={isActive && updatesCount === 0 ? "entry-line-animate" : ""}
        />
      )}

      {/* Main chart line (Visible 13 points) */}
      <path 
        d={pathData} 
        fill="none" 
        stroke="#eab308" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Points */}
      {points.map((point, idx) => {
        const isLastPoint = idx === points.length - 1
        
        // Logic for final result dot
        if (isLastPoint && showResultDot) {
           return (
             <circle 
                key={`result-dot-${idx}`}
                cx={point.x} 
                cy={point.y} 
                r={12} 
                fill={resultColor}
                stroke="#fff"
                strokeWidth="2"
                className="result-dot-animate"
                style={{ color: resultColor }}
             />
           )
        }

        return (
          <circle 
            key={idx} 
            cx={point.x} 
            cy={point.y} 
            r={isLastPoint ? (ticksRemaining === 0 && isActive ? 8 : 5) : 3} 
            fill="#eab308" 
            opacity={isLastPoint ? 1 : 0.7}
            className={`${isLastPoint && ticksRemaining === 0 && isActive ? "target-hit-glow" : ""}`}
          />
        )
      })}
    </svg>
  )
}

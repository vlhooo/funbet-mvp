"use client"

import { useGame } from "@/contexts/game-context"
import Chart from "./chart"
import { useEffect, useRef, useState } from "react"

export default function ChartArea() {
  const { gameState } = useGame()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    // Initial measure
    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Chart
          width={dimensions.width}
          height={dimensions.height}
          visiblePrices={gameState.visiblePrices}
          betDirection={gameState.activeRound.betDirection}
          entryPrice={gameState.activeRound.entryPrice}
          isActive={gameState.activeRound.isActive}
          updatesCount={gameState.activeRound.updatesCount}
          isWon={gameState.result.isWon}
          isFrozen={gameState.activeRound.isFrozen}
        />
      )}
    </div>
  )
}

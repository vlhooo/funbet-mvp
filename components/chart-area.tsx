"use client"

import { useGame } from "@/contexts/game-context"
import Chart from "./chart"

export default function ChartArea() {
  const { gameState } = useGame()

  return (
    <div className="relative w-full h-full bg-background">
      <Chart
        visiblePrices={gameState.visiblePrices}
        betDirection={gameState.activeRound.betDirection}
        entryPrice={gameState.activeRound.entryPrice}
        isActive={gameState.activeRound.isActive}
        updatesCount={gameState.activeRound.updatesCount}
        isWon={gameState.result.isWon}
        isFrozen={gameState.activeRound.isFrozen}
      />
    </div>
  )
}

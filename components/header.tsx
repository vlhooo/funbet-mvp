"use client"

import { useGame } from "@/contexts/game-context"

export default function Header() {
  const { gameState } = useGame()

  return (
    <header className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-accent">FUNNANS</h1>
        <h2 className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">Chart Prediction</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
          <p className="text-2xl md:text-3xl font-bold text-accent">${gameState.balance.toLocaleString()}</p>
        </div>

        <div>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-1">Wins</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{gameState.wins}</p>
        </div>

        <div>
          <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-1">Losses</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{gameState.losses}</p>
        </div>
      </div>
    </header>
  )
}

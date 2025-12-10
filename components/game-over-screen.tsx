"use client"

import { useGame } from "@/contexts/game-context"

export default function GameOverScreen() {
  const { gameState, resetGame } = useGame()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
      <div className="bg-surface border border-border rounded-lg p-8 md:p-12 max-w-md">
        <h1 className="text-4xl md:text-5xl font-bold text-destructive mb-4">GAME OVER</h1>

        <p className="text-lg text-muted-foreground mb-2">Final Stats</p>

        <div className="bg-background rounded-md p-4 mb-6 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Wins</p>
            <p className="text-2xl font-bold text-accent">{gameState.wins}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Losses</p>
            <p className="text-2xl font-bold text-foreground">{gameState.losses}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</p>
            <p className="text-2xl font-bold text-accent">
              {gameState.wins + gameState.losses > 0
                ? ((gameState.wins / (gameState.wins + gameState.losses)) * 100).toFixed(1)
                : "0"}
              %
            </p>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="w-full bg-accent hover:bg-accent/90 text-background font-bold py-3 rounded-md text-lg transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  )
}

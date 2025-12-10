"use client"
import { GameProvider, useGame } from "@/contexts/game-context"
import ChartArea from "@/components/chart-area"
import BettingControls from "@/components/betting-controls"
import ResultModal from "@/components/result-modal"
import GameOverScreen from "@/components/game-over-screen"

function GameContent() {
  const { gameState } = useGame()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="text-center pt-6 pb-4">
        <h1 className="text-white font-bold text-2xl">FunBet</h1>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-between items-center mb-6 text-sm md:text-base">
          <div className="flex gap-6">
            <div>
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-bold ml-2">${gameState.balance}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Wins:</span>
              <span className="font-bold ml-2">{gameState.wins}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Losses:</span>
              <span className="font-bold ml-2">{gameState.losses}</span>
            </div>
          </div>
        </div>

        {gameState.isGameOver && !gameState.result.isVisible ? (
          <GameOverScreen />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:mt-8 mt-0">
            <div className="lg:col-span-2 h-[50vh] md:h-auto md:min-h-96 md:max-h-none">
              <ChartArea />
            </div>
            <div className="lg:col-span-1 md:h-auto md:min-h-96">
              <BettingControls />
            </div>
          </div>
        )}
      </div>

      <ResultModal />
    </main>
  )
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}

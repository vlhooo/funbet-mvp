"use client"
import { GameProvider, useGame } from "@/contexts/game-context"
import ChartArea from "@/components/chart-area"
import BettingControls from "@/components/betting-controls"
import ResultModal from "@/components/result-modal"
import GameOverScreen from "@/components/game-over-screen"

function GameContent() {
  const { gameState } = useGame()
  const { activeRound } = gameState

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="text-center py-2">
        <h1 className="text-white font-bold text-xl">FunBet</h1>
      </div>

      <div className="w-full max-w-7xl mx-auto py-4 md:py-6">
        {/* Stats & Bet Info Container */}
        <div className="flex flex-col gap-1 px-4 mb-4">
          
          {/* Row 1: Balance (Left) & Active Bet (Right) */}
          <div className="flex justify-between items-center text-sm md:text-base">
            <div>
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-bold ml-2">${gameState.balance}</span>
            </div>

            {/* Active Bet Info */}
            <div className={`flex items-center gap-2 transition-all duration-300 ${activeRound.isActive ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`}>
              <span className={!activeRound.isActive ? "text-muted-foreground" : ""}>Bet:</span>
              <span className="font-bold">
                ${activeRound.betAmount > 0 ? activeRound.betAmount : 0} • x{activeRound.betMultiplier ? activeRound.betMultiplier.toFixed(2) : "0.00"}
              </span>
              {/* Max Bet Indicator */}
              {activeRound.isActive && (activeRound.isMaxBetRound || activeRound.isAllIn) && (
                <span className="ml-1 text-red-500 font-extrabold animate-[pulse_0.5s_ease-in-out_infinite]">
                  (x2)
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Wins & Losses (Left aligned or Centered - using left for clean hierarchy) */}
          <div className="flex gap-4 text-xs md:text-sm text-muted-foreground">
            <div>
              <span>Wins:</span>
              <span className="font-bold ml-1 text-green-500">{gameState.wins}</span>
            </div>
            <div>
              <span>Losses:</span>
              <span className="font-bold ml-1 text-red-500">{gameState.losses}</span>
            </div>
          </div>
        </div>

        {gameState.isGameOver && !gameState.result.isVisible ? (
          <GameOverScreen />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-0">
            <div className="lg:col-span-2 h-[40vh] md:h-auto md:min-h-80 md:max-h-none">
              <ChartArea />
            </div>
            <div className="lg:col-span-1 md:h-auto md:min-h-80 px-4">
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

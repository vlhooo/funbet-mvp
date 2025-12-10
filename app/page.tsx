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
      <div className="text-center pt-6 pb-4">
        <h1 className="text-white font-bold text-2xl">FunBet</h1>
      </div>

      <div className="w-full max-w-7xl mx-auto py-6 md:py-8">
        <div className="flex justify-between items-center mb-4 text-sm md:text-base px-4">
          {/* Left Side: Stats */}
          <div className="flex gap-4 md:gap-6 flex-wrap">
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

          {/* Right Side: Bet Info */}
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

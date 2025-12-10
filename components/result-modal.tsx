"use client"

import { useGame } from "@/contexts/game-context"
import { CheckCircle, XCircle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

export default function ResultModal() {
  const { gameState, closeResultModal, resetGame, resumeChartInBackground } = useGame()
  const { result, balance, isGameOver } = gameState
  const [showModal, setShowModal] = useState(false)

  // Add delay to show the result on the chart first
  useEffect(() => {
    if (result?.isVisible) {
      const timer = setTimeout(() => {
        setShowModal(true)
        // Resume chart in background when modal appears
        resumeChartInBackground()
      }, 1000) // 1 second delay
      return () => clearTimeout(timer)
    } else {
      setShowModal(false)
    }
  }, [result?.isVisible, resumeChartInBackground])

  if (!result || !result.isVisible || !showModal) return null

  const { isWon, amount, payout, entryPrice, finalPrice, delta, direction, multiplier } = result
  
  const displayAmount = isWon ? payout : amount
  const sign = isWon ? "+" : "-"
  const colorClass = isWon ? "text-green-500" : "text-red-500"
  
  // Delta color logic: Win = Green, Loss = Red (regardless of delta sign)
  const deltaColorClass = isWon ? "text-green-500" : "text-red-500"

  const handleContinue = () => {
    closeResultModal()
  }

  const handleReset = () => {
    closeResultModal()
    resetGame()
  }

  const showResetButton = isGameOver || balance < 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="p-6 text-center space-y-6">
          
          {/* Top Section: Status & Amount */}
          <div className="space-y-2">
            <h2 className={`text-4xl font-black uppercase tracking-wider ${colorClass}`}>
              {isWon ? "WIN" : "LOSS"}
            </h2>
            <div className={`text-3xl font-bold ${colorClass}`}>
              {sign}${displayAmount.toLocaleString()}
            </div>
          </div>

          {/* Balance Line */}
          <div className="py-2 px-4 bg-zinc-950/50 rounded-lg inline-block border border-zinc-800/50">
            <span className="text-zinc-400 text-sm mr-2">New balance:</span>
            <span className="text-white font-mono font-bold">${balance.toLocaleString()}</span>
          </div>

          {/* Round Details */}
          <div className="bg-zinc-950/80 rounded-lg p-4 text-sm space-y-3 border border-zinc-800 text-left">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
              <span className="text-zinc-500 font-medium uppercase text-xs tracking-wider">Round Details</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Entry price</span>
              <span className="font-mono text-zinc-200">{entryPrice?.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Final price</span>
              <span className="font-mono text-zinc-200">{finalPrice?.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Delta</span>
              <span className={`font-mono font-bold ${deltaColorClass}`}>
                {delta && delta > 0 ? "+" : ""}{delta?.toFixed(0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-800">
              <span className="text-zinc-400">Bet</span>
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <span>${amount}</span>
                <span className="text-zinc-600">•</span>
                <span className={`flex items-center gap-1 ${direction === "UP" ? "text-green-500" : "text-red-500"}`}>
                   {direction === "UP" ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {direction}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-500">x{multiplier?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleContinue}
              className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-white/10"
            >
              Continue
            </button>
            
            {showResetButton && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-all border border-zinc-700 active:scale-[0.98]"
              >
                <RefreshCw size={16} /> Reset Game
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}

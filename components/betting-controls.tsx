"use client"

import type React from "react"

import { useState } from "react"
import { useGame } from "@/contexts/game-context"
import { AlertCircle, ArrowUp, ArrowDown, Sparkles } from "lucide-react"

export default function BettingControls() {
  const { gameState, placeBet, calculateMultipliers } = useGame()
  const [betAmount, setBetAmount] = useState("")
  const [validationError, setValidationError] = useState("")
  const [useMinBet, setUseMinBet] = useState(false)
  const [isHelperEnabled, setIsHelperEnabled] = useState(false)
  const [isMaxBetSelected, setIsMaxBetSelected] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBetAmount(value)
    setValidationError("")
    setIsMaxBetSelected(false) // Reset max bet flag on manual change
  }

  const handleQuickAction = (action: "min" | "half" | "max") => {
    let amount = 0
    if (action === "min") {
      amount = 10
      setIsMaxBetSelected(false)
    }
    else if (action === "half") {
      amount = Math.floor(gameState.balance / 2)
      setIsMaxBetSelected(false)
    }
    else if (action === "max") {
      amount = gameState.balance
      setIsMaxBetSelected(true)
    }

    setBetAmount(amount.toString())
    setValidationError("")
  }

  const handleBet = async (direction: "UP" | "DOWN") => {
    let amount = Number.parseInt(betAmount, 10)
    const minBet = 10

    // Checkbox logic: use min bet if invalid/empty
    if ((!betAmount || isNaN(amount) || amount <= 0) && useMinBet) {
      amount = minBet
      setBetAmount(minBet.toString())
      setIsMaxBetSelected(false)
    }

    if (!amount || isNaN(amount)) {
      setValidationError("Please enter a bet amount")
      return
    }

    if (amount <= 0) {
      setValidationError("Bet amount must be greater than 0")
      return
    }

    if (amount > gameState.balance) {
      setValidationError("Insufficient balance")
      return
    }

    setValidationError("")
    
    // Pass isMaxBetSelected to placeBet
    await placeBet(amount, direction, isMaxBetSelected)
    setBetAmount("")
    setIsMaxBetSelected(false)
  }

  const isRoundActive = gameState.activeRound.isActive
  const isDisabled = isRoundActive || gameState.result.isVisible

  // Calculate current multipliers based on the latest visible price
  const currentPrice = gameState.visiblePrices[gameState.visiblePrices.length - 1]
  const { upMultiplier, downMultiplier } = calculateMultipliers(currentPrice)

  // Prediction Logic
  // Use last 5 points to determine trend
  const historyPoints = gameState.visiblePrices.slice(-5)
  const firstPoint = historyPoints[0]
  const lastPoint = historyPoints[historyPoints.length - 1]
  const trend = lastPoint - firstPoint
  
  // Threshold for "flat" trend
  const FLAT_THRESHOLD = 5
  
  let suggestedDirection: "UP" | "DOWN" | null = null
  
  // Only calculate suggestion if helper is enabled
  if (isHelperEnabled) {
    if (trend > FLAT_THRESHOLD) suggestedDirection = "UP"
    else if (trend < -FLAT_THRESHOLD) suggestedDirection = "DOWN"
  }

  return (
    <div className="bg-surface rounded-lg p-6 border border-border h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <input
          type="number"
          value={betAmount}
          onChange={handleAmountChange}
          disabled={isDisabled}
          placeholder="0"
          className="w-full bg-transparent text-center text-4xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => handleQuickAction("min")}
          disabled={isDisabled}
          className="bg-border hover:bg-border/80 disabled:opacity-50 text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Min
        </button>
        <button
          onClick={() => handleQuickAction("half")}
          disabled={isDisabled}
          className="bg-border hover:bg-border/80 disabled:opacity-50 text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          1/2
        </button>
        <button
          onClick={() => handleQuickAction("max")}
          disabled={isDisabled}
          className="bg-border hover:bg-border/80 disabled:opacity-50 text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Max
        </button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      <div className="flex gap-3 mb-2">
        <button
          onClick={() => handleBet("UP")}
          disabled={isDisabled}
          className={`relative flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-md text-lg transition-all flex flex-col items-center justify-center h-32 gap-1 
            ${!isDisabled && suggestedDirection === "UP" ? "ring-4 ring-green-400/50 scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)]" : ""}
          `}
        >
          {!isDisabled && suggestedDirection === "UP" && (
            <span className="absolute -top-3 bg-green-500 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shadow-sm animate-bounce flex items-center gap-1">
              <Sparkles size={10} fill="currentColor" /> Suggested
            </span>
          )}
          <span>{isRoundActive && gameState.activeRound.betDirection === "UP" ? "..." : "UP"}</span>
          {!isRoundActive && (
            <span className="text-sm opacity-70 font-medium">
              x{upMultiplier.toFixed(2)}
            </span>
          )}
        </button>
        <button
          onClick={() => handleBet("DOWN")}
          disabled={isDisabled}
          className={`relative flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-md text-lg transition-all flex flex-col items-center justify-center h-32 gap-1
            ${!isDisabled && suggestedDirection === "DOWN" ? "ring-4 ring-red-400/50 scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.4)]" : ""}
          `}
        >
          {!isDisabled && suggestedDirection === "DOWN" && (
            <span className="absolute -top-3 bg-destructive text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shadow-sm animate-bounce flex items-center gap-1">
              <Sparkles size={10} fill="currentColor" /> Suggested
            </span>
          )}
          <span>{isRoundActive && gameState.activeRound.betDirection === "DOWN" ? "..." : "DOWN"}</span>
          {!isRoundActive && (
            <span className="text-sm opacity-70 font-medium">
              x{downMultiplier.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Helper Toggle */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setIsHelperEnabled(!isHelperEnabled)}
          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
            isHelperEnabled 
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30" 
              : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-400"
          }`}
        >
          <Sparkles size={12} className={isHelperEnabled ? "fill-purple-300" : ""} />
          Helper: {isHelperEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Use Min Bet Checkbox */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <input
          type="checkbox"
          id="useMinBet"
          checked={useMinBet}
          onChange={(e) => setUseMinBet(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="useMinBet" className="text-sm text-muted-foreground select-none cursor-pointer">
          Use minimum bet if amount is empty
        </label>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground mb-6 text-center">
        {!isRoundActive ? "Select direction and bet amount to begin" : "Round in progress..."}
      </p>

      {/* History List */}
      <div className="border-t border-border pt-4 mt-auto">
        <h3 className="text-sm font-bold text-muted-foreground mb-3">Recent Rounds</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {gameState.history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No rounds yet</p>
          ) : (
            gameState.history.map((round, idx) => (
              <div key={idx} className="bg-background/50 rounded p-2 text-xs flex items-center justify-between border border-border/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>${round.betAmount}</span>
                    <span className="flex items-center gap-0.5">
                      {round.direction === "UP" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      x{round.multiplier.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`font-bold ${round.isWon ? "text-green-500" : "text-destructive"}`}>
                    {round.isWon ? "WIN" : "LOSS"}
                  </span>
                  {round.isWon && (
                    <span className="text-green-500 font-mono">
                      +${round.payout}
                    </span>
                  )}
                  {!round.isWon && (
                    <span className="text-destructive font-mono">
                      -${round.betAmount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

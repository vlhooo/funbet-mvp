"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

interface ActiveRound {
  isActive: boolean
  isFrozen: boolean // Chart freeze state
  betAmount: number
  betDirection: "UP" | "DOWN" | null
  betMultiplier: number | null
  entryPrice: number | null
  updatesCount: number // 0 to 10
  isAllIn?: boolean
  isMaxBetRound?: boolean
}

interface RoundResult {
  betAmount: number
  direction: "UP" | "DOWN"
  multiplier: number
  entryPrice: number
  finalPrice: number
  delta: number
  isWon: boolean
  payout: number
  timestamp: number
}

interface GameState {
  balance: number
  wins: number
  losses: number
  visiblePrices: number[] // 13 items
  activeRound: ActiveRound
  result: {
    isVisible: boolean
    isWon: boolean | null
    amount: number
    payout: number
    // Extended stats
    entryPrice?: number
    finalPrice?: number
    delta?: number
    direction?: "UP" | "DOWN" | null
    multiplier?: number
  }
  history: RoundResult[]
  isGameOver: boolean
}

interface GameContextType {
  gameState: GameState
  placeBet: (amount: number, direction: "UP" | "DOWN", isMaxBet?: boolean) => Promise<void>
  resetGame: () => void
  closeResultModal: () => void
  calculateMultipliers: (entryPrice: number) => { upMultiplier: number; downMultiplier: number }
  resumeChartInBackground: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

const INITIAL_BALANCE = 1000
const Y_MIN = 0
const Y_MAX = 400
const CLAMP_MIN = 5
const CLAMP_MAX = 395

const MIN_MULTIPLIER = 1.10
const MAX_MULTIPLIER = 2.00

// Helper to generate next price with larger delta (-40 to +40)
// For All-in rounds, we will use a larger range (-80 to +80)
// For Max Bet rounds, we will use an even larger range (-100 to +100)
function getNextPrice(currentPrice: number, isAllIn: boolean = false, isMaxBetRound: boolean = false): number {
  let range = 40
  if (isMaxBetRound) {
    range = 100
  } else if (isAllIn) {
    range = 80
  }
  
  // Random delta between -range and +range
  const delta = (Math.random() * (range * 2)) - range
  const next = currentPrice + delta
  return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, next))
}

function generateInitialData(): number[] {
  const data: number[] = []
  let currentPrice = Math.random() * (Y_MAX - Y_MIN) + Y_MIN
  // Ensure starting price is within clamped range
  currentPrice = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, currentPrice))
  
  for (let i = 0; i < 13; i++) {
    data.push(currentPrice)
    currentPrice = getNextPrice(currentPrice)
  }
  return data
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Initialize with deterministic state to avoid hydration mismatch
  const [gameState, setGameState] = useState<GameState>({
    balance: INITIAL_BALANCE,
    wins: 0,
    losses: 0,
    visiblePrices: Array(13).fill(200), // Start with flat line
    activeRound: {
      isActive: false,
      isFrozen: false,
      betAmount: 0,
      betDirection: null,
      betMultiplier: null,
      entryPrice: null,
      updatesCount: 0,
    },
    result: {
      isVisible: false,
      isWon: null,
      amount: 0,
      payout: 0,
    },
    history: [],
    isGameOver: false
  })

  // Load from localStorage or generate random data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chartPredictionGame")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setGameState(prev => ({
             ...parsed,
             // Ensure we have valid data even if loading old state
             visiblePrices: (parsed.visiblePrices && parsed.visiblePrices.length === 13) 
               ? parsed.visiblePrices 
               : generateInitialData(),
             activeRound: parsed.activeRound ? { ...parsed.activeRound, isFrozen: false } : prev.activeRound,
             result: parsed.result || prev.result,
             // History is session-only, so always start empty or keep existing if hot reload
             history: prev.history,
             isGameOver: parsed.isGameOver || false
          }))
        } catch (e) {
          console.error("Failed to parse saved game state", e)
          setGameState(prev => ({
            ...prev,
            visiblePrices: generateInitialData()
          }))
        }
      } else {
        // No saved state, generate random data
        setGameState(prev => ({
          ...prev,
          visiblePrices: generateInitialData()
        }))
      }
      setIsLoaded(true)
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (isLoaded) {
      const toSave = {
        balance: gameState.balance,
        wins: gameState.wins,
        losses: gameState.losses,
        visiblePrices: gameState.visiblePrices,
        activeRound: gameState.activeRound,
        result: gameState.result,
        isGameOver: gameState.isGameOver
        // History not saved to localStorage
      }
      localStorage.setItem("chartPredictionGame", JSON.stringify(toSave))
    }
  }, [gameState, isLoaded])

  // Continuous Update Loop
  useEffect(() => {
    if (!isLoaded) return

    const interval = setInterval(() => {
      setGameState((prev) => {
        // Check Freeze State
        if (prev.activeRound.isActive && prev.activeRound.isFrozen) {
           return prev
        }

        // 1. Shift and generate new price
        const currentPrices = prev.visiblePrices
        const lastPrice = currentPrices[currentPrices.length - 1]
        
        // Determine volatility based on round type
        const isAllInRound = prev.activeRound.isActive && !!prev.activeRound.isAllIn
        const isMaxBetRound = prev.activeRound.isActive && !!prev.activeRound.isMaxBetRound
        
        const nextPrice = getNextPrice(lastPrice, isAllInRound, isMaxBetRound)
        
        const newPrices = [...currentPrices.slice(1), nextPrice]

        // 2. Handle Active Round Logic
        let newActiveRound = { ...prev.activeRound }
        let newResult = { ...prev.result }
        let newBalance = prev.balance
        let newWins = prev.wins
        let newLosses = prev.losses
        let newHistory = prev.history
        let newIsGameOver = prev.isGameOver

        if (prev.activeRound.isActive) {
          const newCount = prev.activeRound.updatesCount + 1
          newActiveRound.updatesCount = newCount

          // Check if round is finished (10 updates)
          if (newCount >= 10) {
            const finalPrice = nextPrice // The newly generated price at index 12
            const entryPrice = prev.activeRound.entryPrice!
            const direction = prev.activeRound.betDirection!
            const multiplier = prev.activeRound.betMultiplier!
            const betAmount = prev.activeRound.betAmount

            let isWon = false
            if (direction === "DOWN") {
              isWon = finalPrice < entryPrice
            } else if (direction === "UP") {
              isWon = finalPrice > entryPrice
            }

            let payout = 0
            if (isWon) {
              payout = Math.floor(betAmount * multiplier)
              newBalance += payout
              newWins += 1
            } else {
              newLosses += 1
            }

            // Create History Item
            const historyItem: RoundResult = {
              betAmount,
              direction,
              multiplier,
              entryPrice,
              finalPrice,
              delta: finalPrice - entryPrice,
              isWon,
              payout,
              timestamp: Date.now()
            }
            // Add to history (newest first)
            newHistory = [historyItem, ...prev.history]

            // Mark round as FROZEN but keep ACTIVE
            newActiveRound = {
              ...prev.activeRound,
              updatesCount: 10,
              isFrozen: true
            }

            // Always show result popup (will trigger after 1s delay in Modal)
            newResult = {
              isVisible: true,
              isWon,
              amount: betAmount,
              payout,
              entryPrice,
              finalPrice,
              delta: finalPrice - entryPrice,
              direction,
              multiplier
            }

            // Check Game Over logic AFTER balance update
            if (newBalance < 10) {
              newIsGameOver = true
            }
          }
        }

        return {
          ...prev,
          visiblePrices: newPrices,
          activeRound: newActiveRound,
          result: newResult,
          balance: newBalance,
          wins: newWins,
          losses: newLosses,
          history: newHistory,
          isGameOver: newIsGameOver
        }
      })
    }, 500) // 0.5 seconds

    return () => clearInterval(interval)
  }, [isLoaded])

  const calculateMultipliers = useCallback((entryPrice: number) => {
    const normalizedUp = entryPrice / Y_MAX
    const rawUp = MIN_MULTIPLIER + (MAX_MULTIPLIER - MIN_MULTIPLIER) * normalizedUp
    const roundedUp = Math.round(rawUp / 0.05) * 0.05
    const upMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, roundedUp))

    const normalizedDown = (Y_MAX - entryPrice) / Y_MAX
    const rawDown = MIN_MULTIPLIER + (MAX_MULTIPLIER - MIN_MULTIPLIER) * normalizedDown
    const roundedDown = Math.round(rawDown / 0.05) * 0.05
    const downMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, roundedDown))

    return {
      upMultiplier: Number(upMultiplier.toFixed(2)),
      downMultiplier: Number(downMultiplier.toFixed(2))
    }
  }, [])

  const placeBet = useCallback(
    async (amount: number, direction: "UP" | "DOWN", isMaxBet: boolean = false) => {
      // 1. Validation
      if (amount <= 0 || amount > gameState.balance) return
      if (gameState.activeRound.isActive) return // Prevent multiple bets
      if (gameState.result.isVisible) return // Prevent bets while result modal is open
      if (gameState.isGameOver) return // Prevent bets if game over

      // 2. Capture current values
      const entryPrice = gameState.visiblePrices[gameState.visiblePrices.length - 1]
      
      // Calculate multipliers at time of bet
      const { upMultiplier, downMultiplier } = calculateMultipliers(entryPrice)
      let activeMultiplier = direction === "UP" ? upMultiplier : downMultiplier

      // Check ALL-IN
      const isAllIn = amount === gameState.balance
      if (isAllIn) {
        activeMultiplier = activeMultiplier * 2
      }

      // Calculate immediate balance deduction
      const balanceAfterDeduction = gameState.balance - amount

      // 3. Update State: Start Round
      setGameState((prev) => ({
        ...prev,
        balance: balanceAfterDeduction,
        activeRound: {
          isActive: true,
          isFrozen: false,
          betAmount: amount,
          betDirection: direction,
          betMultiplier: activeMultiplier,
          entryPrice: entryPrice,
          updatesCount: 0,
          isAllIn: isAllIn,
          isMaxBetRound: isMaxBet // Set flag for max bet
        },
        result: { // Clear previous result
          isVisible: false,
          isWon: null,
          amount: 0,
          payout: 0,
        }
      }))
    },
    [gameState.balance, gameState.activeRound.isActive, gameState.result.isVisible, gameState.isGameOver, gameState.visiblePrices, calculateMultipliers]
  )

  const resetGame = useCallback(() => {
    setGameState({
      balance: INITIAL_BALANCE,
      wins: 0,
      losses: 0,
      visiblePrices: generateInitialData(),
      activeRound: {
        isActive: false,
        isFrozen: false,
        betAmount: 0,
        betDirection: null,
        betMultiplier: null,
        entryPrice: null,
        updatesCount: 0,
      },
      result: {
        isVisible: false,
        isWon: null,
        amount: 0,
        payout: 0,
      },
      history: [],
      isGameOver: false
    })
    localStorage.removeItem("chartPredictionGame")
  }, [])

  const closeResultModal = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      result: {
        ...prev.result,
        isVisible: false,
      },
    }))
  }, [])

  // New function to resume chart background animation
  const resumeChartInBackground = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      activeRound: {
        ...prev.activeRound,
        isActive: false,
        isFrozen: false,
        betAmount: 0,
        betDirection: null,
        betMultiplier: null,
        entryPrice: null,
        updatesCount: 0,
        isMaxBetRound: false, // Reset max bet flag when resuming
        isAllIn: false // Reset all in flag when resuming
      }
    }))
  }, [])

  const value: GameContextType = {
    gameState,
    placeBet,
    resetGame,
    closeResultModal,
    calculateMultipliers,
    resumeChartInBackground
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within GameProvider")
  }
  return context
}

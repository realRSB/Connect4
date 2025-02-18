"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import confetti from "canvas-confetti"
import { io } from "socket.io-client"
import { v4 as uuidv4 } from "uuid"

const ROWS = 6
const COLS = 7

type Player = "red" | "yellow"
type Cell = Player | null
type GameMode = "human" | "ai" | "online"

const WINNING_LENGTH = 4

export default function Connect4() {
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null)),
  )
  const [currentPlayer, setCurrentPlayer] = useState<Player>("red")
  const [winner, setWinner] = useState<Player | "draw" | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>("human")
  const [aiDifficulty, setAiDifficulty] = useState(5)
  const [lastMove, setLastMove] = useState<[number, number] | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [socket, setSocket] = useState<any>(null)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    const newSocket = io("/", { path: "/api/socket" })
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("move-made", (move: number) => {
      dropPiece(move)
    })

    return () => {
      socket.off("move-made")
    }
  }, [socket])

  const startOnlineGame = () => {
    const newGameId = uuidv4()
    setGameId(newGameId)
    setIsHost(true)
    setGameMode("online")
    resetGame()
    socket.emit("join-game", newGameId)
    toast({
      title: "Game created!",
      description: `Share this game ID with your friend: ${newGameId}`,
    })
  }

  const joinOnlineGame = (id: string) => {
    setGameId(id)
    setIsHost(false)
    setGameMode("online")
    resetGame()
    socket.emit("join-game", id)
    toast({
      title: "Joined game!",
      description: "Waiting for host to make a move...",
    })
  }

  const checkWin = useCallback((board: Cell[][], row: number, col: number, player: Player) => {
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]

    for (const [dx, dy] of directions) {
      let count = 1
      for (let i = 1; i < WINNING_LENGTH; i++) {
        const newRow = row + i * dx
        const newCol = col + i * dy
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS || board[newRow][newCol] !== player) {
          break
        }
        count++
      }
      for (let i = 1; i < WINNING_LENGTH; i++) {
        const newRow = row - i * dx
        const newCol = col - i * dy
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS || board[newRow][newCol] !== player) {
          break
        }
        count++
      }
      if (count >= WINNING_LENGTH) {
        return true
      }
    }
    return false
  }, [])

  const evaluateBoard = (board: Cell[][], player: Player) => {
    let score = 0
    const opponent = player === "red" ? "yellow" : "red"

    // Check horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
        let playerCount = 0
        let opponentCount = 0
        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[row][col + i] === player) playerCount++
          else if (board[row][col + i] === opponent) opponentCount++
        }
        score += evaluateWindow(playerCount, opponentCount)
      }
    }

    // Check vertical
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
        let playerCount = 0
        let opponentCount = 0
        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[row + i][col] === player) playerCount++
          else if (board[row + i][col] === opponent) opponentCount++
        }
        score += evaluateWindow(playerCount, opponentCount)
      }
    }

    // Check diagonal (positive slope)
    for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
      for (let col = 0; col <= COLS - WINNING_LENGTH; col++) {
        let playerCount = 0
        let opponentCount = 0
        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[row + i][col + i] === player) playerCount++
          else if (board[row + i][col + i] === opponent) opponentCount++
        }
        score += evaluateWindow(playerCount, opponentCount)
      }
    }

    // Check diagonal (negative slope)
    for (let row = 0; row <= ROWS - WINNING_LENGTH; row++) {
      for (let col = WINNING_LENGTH - 1; col < COLS; col++) {
        let playerCount = 0
        let opponentCount = 0
        for (let i = 0; i < WINNING_LENGTH; i++) {
          if (board[row + i][col - i] === player) playerCount++
          else if (board[row + i][col - i] === opponent) opponentCount++
        }
        score += evaluateWindow(playerCount, opponentCount)
      }
    }

    return score
  }

  const evaluateWindow = (playerCount: number, opponentCount: number) => {
    if (playerCount === 4) return 100
    if (opponentCount === 4) return -100
    if (playerCount === 3 && opponentCount === 0) return 5
    if (playerCount === 2 && opponentCount === 0) return 2
    if (opponentCount === 3 && playerCount === 0) return -5
    if (opponentCount === 2 && playerCount === 0) return -2
    return 0
  }

  const minimax = (
    board: Cell[][],
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean,
  ): [number, number | null] => {
    const availableMoves = getAvailableMoves(board)

    if (depth === 0 || availableMoves.length === 0 || checkGameEnd(board)) {
      return [evaluateBoard(board, "yellow"), null]
    }

    if (maximizingPlayer) {
      let maxEval = Number.NEGATIVE_INFINITY
      let bestMove: number | null = null
      for (const move of availableMoves) {
        const newBoard = makeMove(board, move, "yellow")
        const [evaluation] = minimax(newBoard, depth - 1, alpha, beta, false)
        if (evaluation > maxEval) {
          maxEval = evaluation
          bestMove = move
        }
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) break
      }
      return [maxEval, bestMove]
    } else {
      let minEval = Number.POSITIVE_INFINITY
      let bestMove: number | null = null
      for (const move of availableMoves) {
        const newBoard = makeMove(board, move, "red")
        const [evaluation] = minimax(newBoard, depth - 1, alpha, beta, true)
        if (evaluation < minEval) {
          minEval = evaluation
          bestMove = move
        }
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) break
      }
      return [minEval, bestMove]
    }
  }

  const getAvailableMoves = useCallback((board: Cell[][]) => {
    return board[0].map((_, colIndex) => colIndex).filter((col) => board[0][col] === null)
  }, [])

  const makeMove = (board: Cell[][], col: number, player: Player) => {
    const newBoard = board.map((row) => [...row])
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = player
        break
      }
    }
    return newBoard
  }

  const checkGameEnd = (board: Cell[][]) => {
    // Check for a win
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col]) {
          if (checkWin(board, row, col, board[row][col])) {
            return true
          }
        }
      }
    }
    // Check for a draw
    return board.every((row) => row.every((cell) => cell !== null))
  }

  const dropPiece = useCallback(
    (col: number) => {
      if (winner) return

      const newBoard = board.map((row) => [...row])
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!newBoard[row][col]) {
          newBoard[row][col] = currentPlayer
          setLastMove([row, col])
          if (checkWin(newBoard, row, col, currentPlayer)) {
            setWinner(currentPlayer)
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          } else if (newBoard.every((row) => row.every((cell) => cell !== null))) {
            setWinner("draw")
          } else {
            setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red")
          }
          setBoard(newBoard)

          // If it's an online game, emit the move
          if (gameMode === "online" && socket) {
            socket.emit("make-move", { gameId, move: col })
          }

          break
        }
      }
    },
    [currentPlayer, winner, checkWin, gameMode, socket, gameId, board],
  )

  const getAIMove = useCallback(() => {
    const depth = Math.min(aiDifficulty, 6) // Limit depth for performance
    const [_, bestMove] = minimax(board, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true)
    return bestMove !== null ? bestMove : getAvailableMoves(board)[0]
  }, [board, aiDifficulty]) //Removed minimax, getAvailableMoves from dependencies

  const resetGame = () => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null)),
    )
    setCurrentPlayer("red")
    setWinner(null)
    setLastMove(null)
  }

  useEffect(() => {
    if (gameMode === "ai" && currentPlayer === "yellow" && !winner) {
      const aiMove = getAIMove()
      setTimeout(() => dropPiece(aiMove), 500)
    }
  }, [gameMode, currentPlayer, winner, getAIMove, dropPiece])

  useEffect(() => {
    if (winner) {
      if (winner === "draw") {
        toast({
          title: "It's a draw!",
          description: "Great game! Want to play again?",
        })
      } else {
        toast({
          title: `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`,
          description: "Congratulations! Want to play again?",
        })
      }
    }
  }, [winner])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-4">Connect 4</h1>
      <div className="mb-4 flex space-x-4">
        <Select value={gameMode} onValueChange={(value: GameMode) => setGameMode(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select game mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="human">Human vs Human</SelectItem>
            <SelectItem value="ai">Human vs AI</SelectItem>
            <SelectItem value="online">Play Online</SelectItem>
          </SelectContent>
        </Select>
        {gameMode === "ai" && (
          <div className="flex items-center space-x-2">
            <span>AI Difficulty:</span>
            <Slider
              value={[aiDifficulty]}
              onValueChange={(value) => setAiDifficulty(value[0])}
              max={10}
              step={1}
              className="w-[100px]"
            />
            <span>{aiDifficulty}</span>
          </div>
        )}
        {gameMode === "online" && !gameId && (
          <div className="flex items-center space-x-2">
            <Button onClick={startOnlineGame}>Create Game</Button>
            <input
              type="text"
              placeholder="Enter Game ID"
              className="border p-2 rounded"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  joinOnlineGame((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        )}
      </div>
      <div className="bg-blue-500 p-4 rounded-lg shadow-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`w-12 h-12 bg-white rounded-full m-1 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  lastMove && lastMove[0] === rowIndex && lastMove[1] === colIndex ? "animate-bounce" : ""
                }`}
                onClick={() => dropPiece(colIndex)}
              >
                {cell && (
                  <div className={`w-10 h-10 rounded-full ${cell === "red" ? "bg-red-500" : "bg-yellow-500"}`} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 text-xl font-semibold">
        {winner
          ? winner === "draw"
            ? "It's a draw!"
            : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`
          : `Current player: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`}
      </div>
      <Button onClick={resetGame} className="mt-4">
        New Game
      </Button>
      <Toaster />
    </div>
  )
}


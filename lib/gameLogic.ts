import type { Player, Cell } from "../types"

const ROWS = 6
const COLS = 7
const WINNING_LENGTH = 4

export function checkWin(board: Cell[][], row: number, col: number, player: Player): boolean {
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
}

export function checkDraw(board: Cell[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== null))
}

export function makeMove(board: Cell[][], col: number, player: Player): [Cell[][], number] {
  const newBoard = board.map((row) => [...row])
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!newBoard[row][col]) {
      newBoard[row][col] = player
      return [newBoard, row]
    }
  }
  throw new Error("Invalid move")
}

// Add more game logic functions as needed


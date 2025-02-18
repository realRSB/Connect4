"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BarChart3 } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "@/components/ui/chart"

type GameStats = {
  botAccuracy: { difficulty: number; accuracy: number }[]
  gameOutcomes: { name: string; value: number }[]
  averageMovesPerGame: { difficulty: number; moves: number }[]
}

export default function Statistics() {
  const [stats, setStats] = useState<GameStats | null>(null)

  useEffect(() => {
    // In a real application, this would be an API call
    const fetchStats = async () => {
      // Simulating an API call with setTimeout
      setTimeout(() => {
        setStats({
          botAccuracy: [
            { difficulty: 1, accuracy: 65 },
            { difficulty: 2, accuracy: 72 },
            { difficulty: 3, accuracy: 78 },
            { difficulty: 4, accuracy: 83 },
            { difficulty: 5, accuracy: 87 },
            { difficulty: 6, accuracy: 90 },
            { difficulty: 7, accuracy: 92 },
            { difficulty: 8, accuracy: 94 },
            { difficulty: 9, accuracy: 96 },
            { difficulty: 10, accuracy: 97 },
          ],
          gameOutcomes: [
            { name: "Bot Wins", value: 150 },
            { name: "Human Wins", value: 80 },
            { name: "Draws", value: 40 },
          ],
          averageMovesPerGame: [
            { difficulty: 1, moves: 12 },
            { difficulty: 2, moves: 15 },
            { difficulty: 3, moves: 18 },
            { difficulty: 4, moves: 20 },
            { difficulty: 5, moves: 22 },
            { difficulty: 6, moves: 24 },
            { difficulty: 7, moves: 25 },
            { difficulty: 8, moves: 26 },
            { difficulty: 9, moves: 27 },
            { difficulty: 10, moves: 28 },
          ],
        })
      }, 1000) // Simulate a 1-second delay
    }

    fetchStats()
  }, [])

  if (!stats) {
    return <div>Loading statistics...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Connect 4 Statistics</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2" />
              Bot Accuracy by Difficulty
            </CardTitle>
            <CardDescription>Percentage of optimal moves</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.botAccuracy}>
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2" />
              Game Outcomes
            </CardTitle>
            <CardDescription>Distribution of game results</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.gameOutcomes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2" />
              Average Moves per Game
            </CardTitle>
            <CardDescription>By bot difficulty level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.averageMovesPerGame}>
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="moves" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


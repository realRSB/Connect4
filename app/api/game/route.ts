import { NextResponse } from "next/server"
import { Server } from "socket.io"
import type { Server as NetServer } from "http"
import type { NextApiRequest } from "next"

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any
    const io = new Server(httpServer, {
      path: "/api/socket",
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      socket.on("join-game", (gameId) => {
        socket.join(gameId)
      })

      socket.on("make-move", (data) => {
        socket.to(data.gameId).emit("move-made", data.move)
      })
    })
  }
  res.end()
}

export function GET(req: Request) {
  ioHandler(req as any, NextResponse)
  return new NextResponse("Socket is set up", { status: 200 })
}


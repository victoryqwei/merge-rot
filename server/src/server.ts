import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameRoom } from "./GameRoom";
import { v4 as uuidv4 } from "uuid";
import { GameMode } from "./types/GameTypes";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();

// Serve static files (optional, for hosting client)
app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.json({ message: "Merge Rot Game Server", rooms: gameRooms.size });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join or create a game room
  socket.on("joinRoom", (data: { roomId?: string; gameMode: string }) => {
    let roomId = data.roomId;

    // Create new room if none specified or room doesn't exist
    if (!roomId || !gameRooms.has(roomId)) {
      roomId = uuidv4();
      gameRooms.set(roomId, new GameRoom(roomId, data.gameMode as GameMode, io));
    }

    const room = gameRooms.get(roomId)!;

    // Try to add player to room
    const playerAdded = room.addPlayer(socket.id);
    
    if (!playerAdded) {
      // Room is full, try to create a new room
      roomId = uuidv4();
      const newRoom = new GameRoom(roomId, data.gameMode as GameMode, io);
      gameRooms.set(roomId, newRoom);
      
      // Add player to new room
      newRoom.addPlayer(socket.id);
      socket.join(roomId);
      
      // Send room info to client
      socket.emit("roomJoined", {
        roomId,
        gameMode: newRoom.getGameMode(),
        gameState: newRoom.getGameState(),
      });
      
      console.log(`Player ${socket.id} joined new room ${roomId}`);
    } else {
      // Player successfully added to existing room
      socket.join(roomId);
      
      // Send room info to client
      socket.emit("roomJoined", {
        roomId,
        gameMode: room.getGameMode(),
        gameState: room.getGameState(),
      });
      
      console.log(`Player ${socket.id} joined room ${roomId}`);
    }
  });

  // Handle player input
  socket.on("playerInput", (data: { roomId: string; input: any }) => {
    const room = gameRooms.get(data.roomId);
    if (room) {
      room.handlePlayerInput(socket.id, data.input);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Remove player from all rooms
    for (const [roomId, room] of gameRooms) {
      room.removePlayer(socket.id);

      // Clean up empty rooms
      if (room.getPlayerCount() === 0) {
        room.destroy();
        gameRooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

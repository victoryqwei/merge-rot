import { Server } from "socket.io";
import { ServerGameEngine } from "./ServerGameEngine";
import { GameMode } from "./types/GameTypes";

export interface PlayerInput {
  type: "DROP_CHARACTER" | "MOVE_CURSOR" | "RESTART_GAME" | "POP_MODE";
  x?: number;
  y?: number;
  timestamp: number;
}

export class GameRoom {
  private players: Set<string> = new Set();
  private gameEngine: ServerGameEngine;
  private gameUpdateInterval: NodeJS.Timeout;
  private broadcastInterval: NodeJS.Timeout;
  private lastUpdateTime: number = 0;
  private readonly tickRate: number = 120; // 120 FPS server tickrate for smoother physics
  private readonly broadcastRate: number = 30; // 30 FPS broadcast rate to reduce network overhead

  constructor(private roomId: string, private gameMode: GameMode, private io: Server) {
    this.gameEngine = new ServerGameEngine(gameMode);

    // Start game loop at higher rate for physics
    this.gameUpdateInterval = setInterval(() => {
      this.updateGame();
    }, 1000 / this.tickRate);

    // Start broadcast loop at lower rate for network efficiency
    this.broadcastInterval = setInterval(() => {
      this.broadcastGameState();
    }, 1000 / this.broadcastRate);
  }

  addPlayer(playerId: string): boolean {
    // Only allow one player per room
    if (this.players.size >= 1) {
      console.log(`Player ${playerId} rejected - room ${this.roomId} is full`);
      return false;
    }
    
    this.players.add(playerId);
    console.log(`Player ${playerId} added to room ${this.roomId}`);
    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    console.log(`Player ${playerId} removed from room ${this.roomId}`);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getGameMode(): GameMode {
    return this.gameMode;
  }

  getGameState(): any {
    return this.gameEngine.getGameState();
  }

  handlePlayerInput(playerId: string, input: PlayerInput): void {
    if (!this.players.has(playerId)) {
      return;
    }

    // Process input through game engine
    this.gameEngine.handleInput(input);
  }

  private updateGame(): void {
    const currentTime = Date.now();
    const deltaTime = this.lastUpdateTime ? currentTime - this.lastUpdateTime : 8.33; // ~120fps
    this.lastUpdateTime = currentTime;

    // Update game physics and state
    this.gameEngine.update(deltaTime);
  }

  private broadcastGameState(): void {
    const currentTime = Date.now();
    
    // Get current game state
    const gameState = this.gameEngine.getGameState();

    // Broadcast game state to all players in room
    this.io.to(this.roomId).emit("gameStateUpdate", {
      gameState,
      timestamp: currentTime,
    });
  }

  destroy(): void {
    clearInterval(this.gameUpdateInterval);
    clearInterval(this.broadcastInterval);
    this.gameEngine.destroy();
  }
}

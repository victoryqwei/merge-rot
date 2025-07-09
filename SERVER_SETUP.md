# Server-Side Simulation Setup

This document explains how to set up and run the server-side simulation for your merge rot game.

## Architecture Overview

The server-side simulation consists of:

- **Express Server**: HTTP server with Socket.IO for real-time communication
- **GameRoom**: Manages multiplayer game sessions
- **ServerGameEngine**: Handles authoritative physics simulation and game logic
- **SocketManager**: Client-side connection management

## Setup Instructions

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Install Client Dependencies

```bash
# In project root
npm install
```

### 3. Start the Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

### 4. Start the Client

```bash
# In project root
npm run dev
```

## Integration with Existing Game

To integrate server-side simulation with your existing game:

### 1. Add SocketManager to SuikaGame

```typescript
// In src/game/SuikaGame.ts
import { SocketManager } from '../utils/SocketManager';

export class SuikaGame {
  private socketManager: SocketManager;
  
  constructor(canvas: HTMLCanvasElement | null, gameMode: GameMode) {
    // ... existing code ...
    this.socketManager = new SocketManager(gameMode);
  }
  
  async enableServerMode() {
    await this.socketManager.connect();
    // Disable local physics updates
    // Use server state for rendering
  }
}
```

### 2. Modify Input Handling

```typescript
// In src/game/managers/InputManager.ts
private handleDrop(x: number): void {
  if (this.socketManager?.isConnected()) {
    this.socketManager.dropCharacter(x);
  } else {
    // Existing local drop logic
  }
}
```

### 3. Update Rendering

```typescript
// In src/utils/Renderer.ts
draw(): void {
  const serverState = this.socketManager?.getServerGameState();
  
  if (serverState) {
    // Render from server state
    this.drawServerCharacters(serverState.characters);
  } else {
    // Existing local rendering
  }
}
```

## Key Features

### Authoritative Server
- Physics simulation runs on server
- Anti-cheat protection
- Consistent game state across clients

### Real-time Synchronization
- 60 FPS server tick rate
- Client interpolation for smooth gameplay
- Input lag compensation

### Multiplayer Support
- Room-based game sessions
- Automatic matchmaking
- Player management

## Client-Server Communication

### Client → Server Messages
- `joinRoom`: Join/create a game room
- `playerInput`: Send player actions (drop, restart, etc.)

### Server → Client Messages
- `roomJoined`: Confirmation of room join
- `gameStateUpdate`: Regular game state updates

## Development Commands

```bash
# Start server in development mode
cd server && npm run dev

# Build server
cd server && npm run build

# Start production server
cd server && npm start
```

## Configuration

Server configuration can be modified in:
- `server/src/server.ts` - Main server settings
- `server/src/types/GameTypes.ts` - Game constants
- `src/utils/SocketManager.ts` - Client connection settings

## Next Steps

1. Test the server setup by running both server and client
2. Integrate SocketManager into your existing game classes
3. Add a toggle to switch between local and server mode
4. Implement client-side prediction for smoother gameplay
5. Add reconnection handling for network issues

The server is now ready to handle authoritative game simulation for your merge rot game!
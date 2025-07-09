import { io, Socket } from 'socket.io-client';
import { GameMode, GAME_CONFIG, PHYSICS } from '../constants/GameConstants';
import { CharacterClass } from '../types/GameTypes';
import { makeAutoObservable, observable } from 'mobx';
import * as Matter from 'matter-js';

export interface ServerGameState {
  score: number;
  currentCharacter: any;
  nextCharacter: any;
  gameOver: boolean;
  hasStarted: boolean;
  characters: any[];
  gameMode: GameMode;
}

export interface PlayerInput {
  type: 'DROP_CHARACTER' | 'MOVE_CURSOR' | 'RESTART_GAME' | 'POP_MODE';
  x?: number;
  y?: number;
  timestamp: number;
}

export class SocketManager {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private gameMode: GameMode;
  private serverGameState: ServerGameState | null = null;
  private previousGameState: ServerGameState | null = null;
  private predictedGameState: ServerGameState | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private lastUpdateTime: number = 0;
  private interpolationProgress: number = 0;
  private pendingInputs: PlayerInput[] = [];
  
  // Client-side physics for prediction
  private predictionEngine: Matter.Engine;
  private predictionWorld: Matter.World;
  private predictionBodies: Map<number, Matter.Body> = new Map();

  constructor(gameMode: GameMode) {
    makeAutoObservable(this, {
      // Exclude physics engine and bodies from MobX observability
      predictionEngine: false,
      predictionWorld: false,
      predictionBodies: false,
    });
    this.gameMode = gameMode;
    
    // Initialize client-side physics engine
    this.initializePredictionPhysics();
    
    // Start prediction update loop
    this.startPredictionLoop();
  }

  private initializePredictionPhysics(): void {
    // Create prediction physics engine
    this.predictionEngine = Matter.Engine.create();
    this.predictionWorld = this.predictionEngine.world;
    this.predictionWorld.gravity.y = PHYSICS.GRAVITY;

    // Create boundaries
    const thickness = 20;
    
    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2 + GAME_CONFIG.PADDING + 5,
      GAME_CONFIG.BOX_HEIGHT / 2,
      thickness,
      GAME_CONFIG.BOX_HEIGHT,
      { isStatic: true }
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      GAME_CONFIG.BOX_WIDTH + thickness / 2 + GAME_CONFIG.PADDING - 5,
      GAME_CONFIG.BOX_HEIGHT / 2,
      thickness,
      GAME_CONFIG.BOX_HEIGHT,
      { isStatic: true }
    );

    // Floor
    const floor = Matter.Bodies.rectangle(
      GAME_CONFIG.BOX_WIDTH / 2,
      GAME_CONFIG.BOX_HEIGHT + thickness / 2 - 5,
      GAME_CONFIG.BOX_WIDTH,
      thickness,
      { isStatic: true }
    );

    Matter.World.add(this.predictionWorld, [leftWall, rightWall, floor]);

    // Set up collision events for merge prediction
    Matter.Events.on(this.predictionEngine, 'collisionStart', (event) => {
      this.handlePredictionCollisions(event.pairs);
    });
  }

  private startPredictionLoop(): void {
    setInterval(() => {
      this.updatePrediction();
    }, 1000 / 60); // 60 FPS prediction updates
  }

  private updatePrediction(): void {
    if (!this.predictedGameState) return;

    // Update Matter.js physics
    const fixedTimeStep = 1000 / 60; // 60 FPS
    Matter.Engine.update(this.predictionEngine, fixedTimeStep);

    // Update character positions from physics bodies
    for (const character of this.predictedGameState.characters) {
      const body = this.predictionBodies.get(character.id);
      if (body) {
        character.x = body.position.x;
        character.y = body.position.y;
        character.velocityX = body.velocity.x;
        character.velocityY = body.velocity.y;
        character.angularVelocity = body.angularVelocity;
        character.rotation = body.angle;
      }
    }
  }

  private handlePredictionCollisions(pairs: Matter.IPair[]): void {
    if (!this.predictedGameState) return;

    for (const pair of pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Skip static bodies (walls, floor)
      if (bodyA.isStatic || bodyB.isStatic) continue;
      
      // Find corresponding characters
      const charA = this.findCharacterByBody(bodyA);
      const charB = this.findCharacterByBody(bodyB);
      
      if (charA && charB && charA.name === charB.name) {
        this.handlePredictionMerge(charA, charB);
      }
    }
  }

  private findCharacterByBody(body: Matter.Body): any {
    if (!this.predictedGameState) return null;
    
    return this.predictedGameState.characters.find(char => {
      const characterBody = this.predictionBodies.get(char.id);
      return characterBody === body;
    });
  }

  private handlePredictionMerge(charA: any, charB: any): void {
    if (!this.predictedGameState) return;

    // Find next character in evolution
    const currentCharacterClass = CharacterClass.getByName(charA.name, this.gameMode);
    const nextCharacterClass = currentCharacterClass?.getNextCharacter();
    
    if (!nextCharacterClass) return;

    // Calculate merge position (midpoint)
    const mergeX = (charA.x + charB.x) / 2;
    const mergeY = (charA.y + charB.y) / 2;

    // Remove old characters
    this.removePredictedCharacter(charA.id);
    this.removePredictedCharacter(charB.id);

    // Create new merged character
    this.createPredictedCharacter(nextCharacterClass, mergeX, mergeY);

    // Update score
    this.predictedGameState.score += nextCharacterClass.points * 2;
  }

  private removePredictedCharacter(id: number): void {
    if (!this.predictedGameState) return;

    // Remove from predicted characters
    this.predictedGameState.characters = this.predictedGameState.characters.filter(char => char.id !== id);
    
    // Remove physics body
    const body = this.predictionBodies.get(id);
    if (body) {
      Matter.World.remove(this.predictionWorld, body);
      this.predictionBodies.delete(id);
    }
  }

  private createPredictedCharacter(characterClass: CharacterClass, x: number, y: number): void {
    if (!this.predictedGameState) return;

    const characterId = Date.now() + Math.random(); // Unique ID
    
    // Create physics body
    const body = Matter.Bodies.circle(x, y, characterClass.radius, {
      restitution: 0.3,
      friction: 0.9,
      density: 0.005,
      frictionAir: 0.05,
      slop: 0.01,
    });

    // Add to physics world
    Matter.World.add(this.predictionWorld, body);
    this.predictionBodies.set(characterId, body);

    // Create character
    const newCharacter = {
      id: characterId,
      name: characterClass.name,
      radius: characterClass.radius,
      points: characterClass.points,
      displayName: characterClass.displayName,
      characterTypeName: characterClass.name,
      gameMode: this.gameMode,
      x: x,
      y: y,
      velocityX: 0,
      velocityY: 0,
      angularVelocity: 0,
      rotation: 0
    };

    // Add to predicted characters
    this.predictedGameState.characters.push(newCharacter);
  }

  connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectionStatus = 'connecting';
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connectionStatus = 'connected';
        this.joinRoom();
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connectionStatus = 'disconnected';
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connectionStatus = 'disconnected';
        reject(error);
      });

      this.socket.on('roomJoined', (data: { roomId: string; gameMode: GameMode; gameState: ServerGameState }) => {
        this.roomId = data.roomId;
        this.serverGameState = data.gameState;
        
        // Initialize prediction state when joining room
        this.predictedGameState = { 
          ...data.gameState,
          characters: data.gameState.characters.map(char => ({ ...char })) // Deep copy characters array
        };
        
        console.log('Joined room:', data.roomId);
      });

      this.socket.on('gameStateUpdate', (data: { gameState: ServerGameState; timestamp: number }) => {
        this.previousGameState = this.serverGameState;
        this.serverGameState = data.gameState;
        this.lastUpdateTime = Date.now();
        this.interpolationProgress = 0;
        
        // Initialize or update prediction state with server state
        if (!this.predictedGameState) {
          this.predictedGameState = { 
            ...data.gameState,
            characters: data.gameState.characters.map(char => ({ ...char })) // Deep copy characters array
          };
        } else {
          // Update predicted state with server corrections (but keep predicted characters)
          this.predictedGameState.score = data.gameState.score;
          this.predictedGameState.currentCharacter = data.gameState.currentCharacter;
          this.predictedGameState.nextCharacter = data.gameState.nextCharacter;
          this.predictedGameState.gameOver = data.gameState.gameOver;
          this.predictedGameState.hasStarted = data.gameState.hasStarted;
          this.predictedGameState.gameMode = data.gameState.gameMode;
        }
      });
    });
  }

  private joinRoom(): void {
    if (!this.socket) return;

    this.socket.emit('joinRoom', {
      roomId: this.roomId, // null for auto-join
      gameMode: this.gameMode
    });
  }

  sendInput(input: PlayerInput): void {
    if (!this.socket || !this.roomId) return;

    // Add to pending inputs for prediction
    this.pendingInputs.push(input);

    this.socket.emit('playerInput', {
      roomId: this.roomId,
      input: {
        ...input,
        timestamp: Date.now()
      }
    });
  }

  dropCharacter(x: number): void {
    const input = {
      type: 'DROP_CHARACTER' as const,
      x,
      timestamp: Date.now()
    };
    
    this.sendInput(input);
    
    // Client-side prediction
    this.applyInputPrediction(input);
  }

  restartGame(): void {
    this.sendInput({
      type: 'RESTART_GAME',
      timestamp: Date.now()
    });
  }

  popMode(): void {
    this.sendInput({
      type: 'POP_MODE',
      timestamp: Date.now()
    });
  }

  getServerGameState(): ServerGameState | null {
    return this.serverGameState;
  }

  getPredictedGameState(): ServerGameState | null {
    return this.predictedGameState;
  }

  private applyInputPrediction(input: PlayerInput): void {
    if (!this.predictedGameState) return;

    switch (input.type) {
      case 'DROP_CHARACTER':
        this.predictDropCharacter(input.x || 0);
        break;
      case 'RESTART_GAME':
        this.predictRestart();
        break;
    }
  }

  private predictDropCharacter(x: number): void {
    if (!this.predictedGameState) return;

    const currentCharacter = this.predictedGameState.currentCharacter;
    if (!currentCharacter) return;

    // Create the predicted character
    this.createPredictedCharacter(currentCharacter, x, 50);

    // Update current character to next character
    this.predictedGameState.currentCharacter = this.predictedGameState.nextCharacter;
    
    // Generate a new next character (simple prediction)
    this.predictedGameState.nextCharacter = CharacterClass.getRandom(this.gameMode);
    
    this.predictedGameState.hasStarted = true;
  }

  private predictRestart(): void {
    if (!this.predictedGameState) return;

    // Clear all physics bodies
    for (const [id, body] of this.predictionBodies) {
      Matter.World.remove(this.predictionWorld, body);
    }
    this.predictionBodies.clear();

    this.predictedGameState.score = 0;
    this.predictedGameState.characters = [];
    this.predictedGameState.gameOver = false;
    this.predictedGameState.hasStarted = false;
    this.predictedGameState.currentCharacter = CharacterClass.getRandom(this.gameMode);
    this.predictedGameState.nextCharacter = CharacterClass.getRandom(this.gameMode);
    this.pendingInputs = [];
  }

  getInterpolatedGameState(): ServerGameState | null {
    if (!this.serverGameState || !this.previousGameState) {
      return this.serverGameState;
    }

    // Calculate interpolation progress based on time since last update
    const currentTime = Date.now();
    const timeSinceUpdate = currentTime - this.lastUpdateTime;
    const updateInterval = 1000 / 30; // 30 FPS broadcast rate
    this.interpolationProgress = Math.min(timeSinceUpdate / updateInterval, 1);

    // Interpolate character positions
    const interpolatedState = { ...this.serverGameState };
    interpolatedState.characters = this.serverGameState.characters.map((current, index) => {
      const previous = this.previousGameState!.characters[index];
      if (!previous) return current;

      return {
        ...current,
        x: this.lerp(previous.x, current.x, this.interpolationProgress),
        y: this.lerp(previous.y, current.y, this.interpolationProgress),
        rotation: this.lerpAngle(previous.rotation, current.rotation, this.interpolationProgress),
      };
    });

    return interpolatedState;
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private lerpAngle(start: number, end: number, progress: number): number {
    // Handle angle wrapping for smooth rotation interpolation
    let diff = end - start;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    return start + diff * progress;
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.socket?.connected === true;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this.roomId = null;
    this.serverGameState = null;
  }
}
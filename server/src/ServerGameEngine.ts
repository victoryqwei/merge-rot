import * as Matter from 'matter-js';
import { CharacterClass, GameMode, GameState, SerializedCharacter, PHYSICS, GAME_CONFIG } from './types/GameTypes';
import { PlayerInput } from './GameRoom';

export class ServerGameEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private gameState: GameState;
  private bodies: Map<number, Matter.Body> = new Map();
  private gameOverTimer: number = 0;
  private gameOverDelay: number = 2;
  private lastDropTime: number = 0;

  constructor(gameMode: GameMode) {
    // Initialize Matter.js physics
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = PHYSICS.GRAVITY;

    // Initialize game state
    this.gameState = {
      score: 0,
      currentCharacter: CharacterClass.getRandom(gameMode),
      nextCharacter: CharacterClass.getRandom(gameMode),
      gameOver: false,
      hasStarted: false,
      characters: [],
      gameMode
    };

    // Create world boundaries
    this.createBoundaries();
    
    // Set up collision events
    this.setupCollisionEvents();
  }

  private createBoundaries(): void {
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

    Matter.World.add(this.world, [leftWall, rightWall, floor]);
  }

  private setupCollisionEvents(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (const pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Find corresponding character IDs
        const characterA = this.findCharacterByBody(bodyA);
        const characterB = this.findCharacterByBody(bodyB);
        
        if (characterA && characterB && characterA.name === characterB.name) {
          this.handleCharacterMerge(characterA, characterB);
        }
      }
    });
  }

  private findCharacterByBody(body: Matter.Body): SerializedCharacter | null {
    return this.gameState.characters.find(char => {
      const characterBody = this.bodies.get(char.id);
      return characterBody === body;
    }) || null;
  }

  private handleCharacterMerge(charA: SerializedCharacter, charB: SerializedCharacter): void {
    // Find next character in evolution
    const currentCharacterClass = CharacterClass.getByName(charA.name, this.gameState.gameMode);
    const nextCharacterClass = currentCharacterClass?.getNextCharacter();
    
    if (!nextCharacterClass) return;

    // Calculate merge position (midpoint)
    const mergeX = (charA.x + charB.x) / 2;
    const mergeY = (charA.y + charB.y) / 2;

    // Remove old characters
    this.removeCharacter(charA.id);
    this.removeCharacter(charB.id);

    // Create new merged character
    this.createCharacter(nextCharacterClass, mergeX, mergeY);

    // Update score
    this.gameState.score += nextCharacterClass.points * 2;
  }

  private createCharacter(characterClass: CharacterClass, x: number, y: number): void {
    const id = CharacterClass.generateId();
    
    // Create physics body
    const body = Matter.Bodies.circle(x, y, characterClass.radius, {
      restitution: 0.3,
      friction: 0.9,
      density: 0.005,
      frictionAir: 0.05,
      slop: 0.01,
    });

    // Add to world
    Matter.World.add(this.world, body);
    this.bodies.set(id, body);

    // Create serialized character
    const character: SerializedCharacter = {
      id,
      name: characterClass.name,
      radius: characterClass.radius,
      points: characterClass.points,
      displayName: characterClass.displayName,
      characterTypeName: characterClass.name,
      gameMode: this.gameState.gameMode,
      x,
      y,
      velocityX: 0,
      velocityY: 0,
      angularVelocity: 0,
      rotation: 0
    };

    this.gameState.characters.push(character);
  }

  private removeCharacter(id: number): void {
    // Remove from game state
    this.gameState.characters = this.gameState.characters.filter(char => char.id !== id);
    
    // Remove physics body
    const body = this.bodies.get(id);
    if (body) {
      Matter.World.remove(this.world, body);
      this.bodies.delete(id);
    }
  }

  private checkGameOver(): void {
    // Check if any character is above the game over line
    const gameOverY = GAME_CONFIG.GAME_OVER_HEIGHT;
    
    for (const character of this.gameState.characters) {
      if (character.y - character.radius < gameOverY) {
        this.gameOverTimer += 1;
        if (this.gameOverTimer >= this.gameOverDelay * 60) { // 60 fps * 2 seconds
          this.gameState.gameOver = true;
        }
        return;
      }
    }
    
    // Reset timer if no characters above line
    this.gameOverTimer = 0;
  }

  update(_deltaTime: number): void {
    if (this.gameState.gameOver) return;

    // Use fixed timestep for consistent physics simulation
    const fixedTimeStep = 1000 / 120; // 120 FPS fixed timestep
    Matter.Engine.update(this.engine, fixedTimeStep);

    // Update character positions from physics bodies
    for (const character of this.gameState.characters) {
      const body = this.bodies.get(character.id);
      if (body) {
        character.x = body.position.x;
        character.y = body.position.y;
        character.velocityX = body.velocity.x;
        character.velocityY = body.velocity.y;
        character.angularVelocity = body.angularVelocity;
        character.rotation = body.angle;
      }
    }

    // Check for game over
    this.checkGameOver();
  }

  handleInput(input: PlayerInput): void {
    if (this.gameState.gameOver) return;

    switch (input.type) {
      case 'DROP_CHARACTER':
        this.handleDropCharacter(input.x || 0);
        break;
      case 'RESTART_GAME':
        this.restartGame();
        break;
      case 'POP_MODE':
        // TODO: Implement pop mode
        break;
    }
  }

  private handleDropCharacter(x: number): void {
    const currentTime = Date.now();
    
    // Check cooldown
    if (currentTime - this.lastDropTime < GAME_CONFIG.DROP_COOLDOWN_TIME) {
      return;
    }

    if (!this.gameState.currentCharacter) return;

    // Clamp x position to game bounds
    const clampedX = Math.max(
      this.gameState.currentCharacter.radius + GAME_CONFIG.PADDING,
      Math.min(x, GAME_CONFIG.BOX_WIDTH - this.gameState.currentCharacter.radius + GAME_CONFIG.PADDING)
    );

    // Create character at drop position
    this.createCharacter(this.gameState.currentCharacter, clampedX, 50);

    // Update current/next characters
    this.gameState.currentCharacter = this.gameState.nextCharacter;
    this.gameState.nextCharacter = CharacterClass.getRandom(this.gameState.gameMode);
    this.gameState.hasStarted = true;

    this.lastDropTime = currentTime;
  }

  private restartGame(): void {
    // Clear all characters
    for (const character of this.gameState.characters) {
      this.removeCharacter(character.id);
    }

    // Reset game state
    this.gameState = {
      score: 0,
      currentCharacter: CharacterClass.getRandom(this.gameState.gameMode),
      nextCharacter: CharacterClass.getRandom(this.gameState.gameMode),
      gameOver: false,
      hasStarted: false,
      characters: [],
      gameMode: this.gameState.gameMode
    };

    this.gameOverTimer = 0;
    this.lastDropTime = 0;
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
  }
}
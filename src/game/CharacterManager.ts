import { Character, CharacterClass } from "../types/GameTypes";
import type { Particle } from "../types/GameTypes";
import { GAME_CONFIG, GameMode } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { Sound, SoundManager } from "../utils/SoundManager";
import { ImageManager } from "../utils/ImageManager";
import { BodyCache } from "../utils/BodyCache";
import { AnimationManager } from "./managers/AnimationManager";
import { random } from "lodash";
import * as Matter from "matter-js";

export class CharacterManager {
  private characters = new Map<number, Character>(); // Use Map with character ID as key
  private particles: Particle[] = [];
  private physicsEngine: PhysicsEngine;
  private soundManager: SoundManager;
  private imageManager: ImageManager;
  private bodyCache: BodyCache;
  private gameMode: GameMode;
  private animationManager?: AnimationManager;

  constructor(physicsEngine: PhysicsEngine, soundManager: SoundManager, gameMode: GameMode = GameMode.ITALIAN_BRAINROT) {
    this.physicsEngine = physicsEngine;
    this.soundManager = soundManager;
    this.imageManager = new ImageManager();
    this.bodyCache = new BodyCache(physicsEngine, this.imageManager);
    this.gameMode = gameMode;
  }

  getBodyCache(): BodyCache {
    return this.bodyCache;
  }

  setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
  }

  getGameMode(): GameMode {
    return this.gameMode;
  }

  /**
   * Get body cache statistics for debugging
   */
  getBodyCacheStats(): { size: number; keys: string[] } {
    return this.bodyCache.getStats();
  }

  generateRandomCharacter(): CharacterClass {
    return CharacterClass.getRandom(this.gameMode, 4); // Start with smaller characters (tier 0-4)
  }

  async createCharacter(characterType: CharacterClass, x: number, y: number): Promise<Character> {
    // Use cached body creation for better performance
    const body = await this.bodyCache.getBody(characterType, x, y);

    // Add some initial angular velocity for rotation
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1); // Random rotation between -0.05 and 0.05

    const newCharacter = new Character(
      CharacterClass.generateId(),
      characterType.name,
      characterType.radius,
      characterType.points,
      characterType.displayName,
      body,
      0, // Initial rotation
      characterType
    );

    return newCharacter;
  }

  addCharacter(character: Character): void {
    this.characters.set(character.id, character);
  }

  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  updateCharacters(deltaTime: number): void {
    this.physicsEngine.update(deltaTime * 1000);

    // Update character rotations based on physics body rotation
    for (const character of this.characters.values()) {
      character.rotation = this.physicsEngine.getBodyRotation(character.body);
    }
  }

  async checkCombinations(): Promise<number> {
    let scoreIncrease = 0;
    const charactersToRemove = new Set<number>(); // Use Set for O(1) lookups
    const charactersToAdd: Character[] = [];

    // Get all current collision pairs from physics engine once
    const allCollisionPairs = this.physicsEngine.getAllCollisionPairs();

    // Group characters by type for efficient pairing
    const charactersByType = new Map<string, Character[]>();
    for (const character of this.characters.values()) {
      if (!charactersByType.has(character.name)) {
        charactersByType.set(character.name, []);
      }
      charactersByType.get(character.name)!.push(character);
    }

    // Only process character types that have multiple instances
    for (const [, charactersOfType] of charactersByType) {
      if (charactersOfType.length < 2) continue;

      // Check combinations within this character type
      for (let i = 0; i < charactersOfType.length; i++) {
        const character1 = charactersOfType[i];

        // Skip if already marked for removal
        if (charactersToRemove.has(character1.id)) continue;

        for (let j = i + 1; j < charactersOfType.length; j++) {
          const character2 = charactersOfType[j];

          // Skip if already marked for removal
          if (charactersToRemove.has(character2.id)) continue;

          // Check if these two characters are colliding using pre-computed pairs
          if (!this.areCharactersColliding(character1, character2, allCollisionPairs)) continue;

          // Get the current character class and find the next one
          const currentCharacterClass = CharacterClass.getByName(character1.name, this.gameMode);
          if (!currentCharacterClass) continue;

          const nextCharacterClass = currentCharacterClass.getNextCharacter();
          if (!nextCharacterClass) continue; // Can't merge if it's the highest tier

          // Calculate new position and velocity
          const pos1 = this.physicsEngine.getBodyPosition(character1.body);
          const pos2 = this.physicsEngine.getBodyPosition(character2.body);
          const vel1 = this.physicsEngine.getBodyVelocity(character1.body);
          const vel2 = this.physicsEngine.getBodyVelocity(character2.body);

          // Create new merged character
          const newCharacter = await this.createCharacter(nextCharacterClass, (pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);

          // Set velocity
          newCharacter.body.velocity.x = (vel1.x + vel2.x) / 2;
          newCharacter.body.velocity.y = (vel1.y + vel2.y) / 2;

          // Add some extra angular velocity for the merged character
          const extraRotation = (Math.random() - 0.5) * 0.2; // Extra rotation for merged characters
          Matter.Body.setAngularVelocity(newCharacter.body, extraRotation);

          // Play sound for the new merged character
          if (nextCharacterClass.hasSound) {
            this.soundManager.playSoundDebounced(nextCharacterClass.name, 800);
          }

          // Adjust pitch based on the size of the character
          const pitch = 1.2 - (nextCharacterClass.radius - 25) / 100; // Scale pitch based on character size
          this.soundManager.playPop(Sound.Pop, pitch);

          // Mark characters for removal using Set
          charactersToRemove.add(character1.id);
          charactersToRemove.add(character2.id);

          // Add new character to the list
          charactersToAdd.push(newCharacter);

          // Add score
          scoreIncrease += nextCharacterClass.points * 10;

          // Record merge for combo system
          if (this.animationManager) {
            this.animationManager.recordMerge();
            // Apply combo multiplier to score
            const comboMultiplier = this.animationManager.getComboMultiplier();
            scoreIncrease = scoreIncrease * comboMultiplier;
          }

          // Add explosion effect
          this.createExplosion(newCharacter.body.position.x, newCharacter.body.position.y);

          // Break out of inner loop since we've found a combination for character1
          break;
        }
      }
    }

    // Remove old characters and their physics bodies
    for (const id of charactersToRemove) {
      const character = this.characters.get(id);
      if (character) {
        this.physicsEngine.removeBody(character.body);
        this.characters.delete(id);
      }
    }

    // Add new characters
    charactersToAdd.forEach((character) => {
      this.characters.set(character.id, character);
    });

    return scoreIncrease;
  }

  /**
   * Check if two characters are colliding using pre-computed collision pairs
   */
  private areCharactersColliding(
    character1: Character,
    character2: Character,
    collisionPairs: Array<{ bodyA: Matter.Body; bodyB: Matter.Body }>
  ): boolean {
    for (const pair of collisionPairs) {
      if (
        (pair.bodyA.id === character1.body.id && pair.bodyB.id === character2.body.id) ||
        (pair.bodyA.id === character2.body.id && pair.bodyB.id === character1.body.id)
      ) {
        return true;
      }
    }
    return false;
  }

  private createExplosion(x: number, y: number): void {
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
      const particle: Particle = {
        x,
        y,
        vx: random(-0.5, 0.5) * GAME_CONFIG.PARTICLE_SPEED,
        vy: random(-0.5, 0.5) * GAME_CONFIG.PARTICLE_SPEED,
        life: GAME_CONFIG.PARTICLE_LIFE,
      };
      this.particles.push(particle);
    }
  }

  updateParticles(deltaTime: number = 1 / 60): void {
    // Cap delta time to prevent large jumps when window regains focus
    const clampedDeltaTime = Math.min(deltaTime, GAME_CONFIG.MAX_DELTA_TIME);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx * clampedDeltaTime * 60; // Scale to maintain same speed at 60fps
      particle.y += particle.vy * clampedDeltaTime * 60;
      particle.life -= clampedDeltaTime * 60; // Scale to maintain same lifetime at 60fps

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  checkGameOver(deltaTime: number): boolean {
    return this.physicsEngine.checkGameOver(deltaTime);
  }

  clear(): void {
    this.physicsEngine.clear();
    this.characters.clear();
    this.particles = [];
    this.bodyCache.clear();
  }

  setAnimationManager(animationManager: AnimationManager): void {
    this.animationManager = animationManager;
  }

  getImageManager(): ImageManager {
    return this.imageManager;
  }
}

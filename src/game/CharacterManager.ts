import type { Character, Particle } from "../types/GameTypes";
import { CharacterClass } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager } from "../utils/SoundManager";
import { random } from "lodash";

export class CharacterManager {
  private characters: Character[] = [];
  private particles: Particle[] = [];
  private physicsEngine: PhysicsEngine;
  private soundManager: SoundManager;

  constructor(physicsEngine: PhysicsEngine, soundManager: SoundManager) {
    this.physicsEngine = physicsEngine;
    this.soundManager = soundManager;
  }

  generateRandomCharacter(): CharacterClass {
    return CharacterClass.getRandom(4); // Start with smaller characters (tier 0-4)
  }

  createCharacter(characterType: CharacterClass, x: number, y: number): Character {
    const body = this.physicsEngine.createCharacterBody(characterType.radius, x, y);

    return {
      name: characterType.name,
      radius: characterType.radius,
      points: characterType.points,
      displayName: characterType.displayName,
      body,
    };
  }

  addCharacter(character: Character): void {
    this.characters.push(character);
  }

  getCharacters(): Character[] {
    return this.characters;
  }

  updateCharacters(): void {
    this.physicsEngine.update();
  }

  checkCombinations(): number {
    let scoreIncrease = 0;

    for (let i = 0; i < this.characters.length; i++) {
      for (let j = i + 1; j < this.characters.length; j++) {
        const character1 = this.characters[i];
        const character2 = this.characters[j];

        if (character1.name === character2.name) {
          if (this.physicsEngine.checkCollision(character1, character2)) {
            // Get the current character class and find the next one
            const currentCharacterClass = CharacterClass.getByName(character1.name);
            if (!currentCharacterClass) continue;

            const nextCharacterClass = currentCharacterClass.getNextCharacter();
            if (!nextCharacterClass) continue; // Can't merge if it's the highest tier

            const pos1 = this.physicsEngine.getBodyPosition(character1.body);
            const pos2 = this.physicsEngine.getBodyPosition(character2.body);
            const vel1 = this.physicsEngine.getBodyVelocity(character1.body);
            const vel2 = this.physicsEngine.getBodyVelocity(character2.body);

            const newCharacter = this.createCharacter(nextCharacterClass, (pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);

            // Set velocity
            newCharacter.body.velocity.x = (vel1.x + vel2.x) / 2;
            newCharacter.body.velocity.y = (vel1.y + vel2.y) / 2;

            // Play sound for the new merged character
            // Use debounced sound for all characters - SoundManager will prioritize highest tier
            this.soundManager.playSoundDebounced(nextCharacterClass.name, 500);
            // Play pop sound
            this.soundManager.playPop();

            // Remove old characters
            this.physicsEngine.removeBody(character1.body);
            this.physicsEngine.removeBody(character2.body);
            this.characters.splice(j, 1);
            this.characters.splice(i, 1);

            // Add new character
            this.characters.push(newCharacter);

            // Add score
            scoreIncrease += nextCharacterClass.points * 10;

            // Add explosion effect
            this.createExplosion(newCharacter.body.position.x, newCharacter.body.position.y);

            return scoreIncrease; // Exit to avoid index issues
          }
        }
      }
    }

    return scoreIncrease;
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

  updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  checkGameOver(): boolean {
    return this.physicsEngine.checkGameOver();
  }

  clear(): void {
    this.physicsEngine.clear();
    this.characters = [];
    this.particles = [];
  }
}

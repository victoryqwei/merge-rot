import type { Character, CharacterType, Particle } from "../types/GameTypes";
import { CHARACTER_TYPES, GAME_CONFIG } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { random } from "lodash";

export class CharacterManager {
  private characters: Character[] = [];
  private particles: Particle[] = [];
  private physicsEngine: PhysicsEngine;

  constructor(physicsEngine: PhysicsEngine) {
    this.physicsEngine = physicsEngine;
  }

  generateRandomCharacter(): CharacterType {
    const randomIndex = random(0, 4); // Start with smaller characters
    return CHARACTER_TYPES[randomIndex];
  }

  createCharacter(characterType: CharacterType, x: number, y: number): Character {
    const body = this.physicsEngine.createCharacterBody(characterType.radius, x, y);

    return {
      ...characterType,
      body,
      type: CHARACTER_TYPES.indexOf(characterType),
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

        if (character1.type === character2.type && character1.type < CHARACTER_TYPES.length - 1) {
          if (this.physicsEngine.checkCollision(character1, character2)) {
            // Combine characters
            const newType = character1.type + 1;
            const pos1 = this.physicsEngine.getBodyPosition(character1.body);
            const pos2 = this.physicsEngine.getBodyPosition(character2.body);
            const vel1 = this.physicsEngine.getBodyVelocity(character1.body);
            const vel2 = this.physicsEngine.getBodyVelocity(character2.body);

            const newCharacter = this.createCharacter(CHARACTER_TYPES[newType], (pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);

            // Set velocity
            newCharacter.body.velocity.x = (vel1.x + vel2.x) / 2;
            newCharacter.body.velocity.y = (vel1.y + vel2.y) / 2;

            // Remove old characters
            this.physicsEngine.removeBody(character1.body);
            this.physicsEngine.removeBody(character2.body);
            this.characters.splice(j, 1);
            this.characters.splice(i, 1);

            // Add new character
            this.characters.push(newCharacter);

            // Add score
            scoreIncrease += CHARACTER_TYPES[newType].points * 10;

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

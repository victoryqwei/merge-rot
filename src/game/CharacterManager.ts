import { Character, CharacterClass } from "../types/GameTypes";
import type { Particle } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager } from "../utils/SoundManager";
import { ImageManager } from "../utils/ImageManager";
import { random } from "lodash";
import * as Matter from "matter-js";

export class CharacterManager {
  private characters = new Map<number, Character>(); // Use Map with character ID as key
  private particles: Particle[] = [];
  private physicsEngine: PhysicsEngine;
  private soundManager: SoundManager;
  private imageManager: ImageManager;

  constructor(physicsEngine: PhysicsEngine, soundManager: SoundManager) {
    this.physicsEngine = physicsEngine;
    this.soundManager = soundManager;
    this.imageManager = new ImageManager();
  }

  generateRandomCharacter(): CharacterClass {
    return CharacterClass.getRandom(4); // Start with smaller characters (tier 0-4)
  }

  async createCharacter(characterType: CharacterClass, x: number, y: number): Promise<Character> {
    let body: Matter.Body;

    // Try to get the character image
    const image = this.imageManager.getImage(characterType.name);

    if (image && image.complete) {
      // Use image-based physics body
      body = await this.physicsEngine.createCharacterBodyFromImage(image, characterType.radius, x, y);
    } else {
      // Fallback to circle physics body
      body = this.physicsEngine.createCharacterBody(characterType.radius, x, y);
    }

    // Add some initial angular velocity for rotation
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1); // Random rotation between -0.05 and 0.05

    const newCharacter = new Character(
      CharacterClass.generateId(),
      characterType.name,
      characterType.radius,
      characterType.points,
      characterType.displayName,
      body,
      0 // Initial rotation
    );

    return newCharacter;
  }

  addCharacter(character: Character): void {
    this.characters.set(character.id, character);
  }

  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  updateCharacters(): void {
    this.physicsEngine.update();

    // Update character rotations based on physics body rotation
    for (const character of this.characters.values()) {
      character.rotation = this.physicsEngine.getBodyRotation(character.body);
    }
  }

  async checkCombinations(): Promise<number> {
    let scoreIncrease = 0;
    const charactersToRemove: number[] = [];
    const charactersToAdd: Character[] = [];

    // Convert map to array for easier iteration
    const characterArray = Array.from(this.characters.values());

    // Check all character pairs for combinations
    for (let i = 0; i < characterArray.length; i++) {
      for (let j = i + 1; j < characterArray.length; j++) {
        const character1 = characterArray[i];
        const character2 = characterArray[j];

        if (character1.id === character2.id) continue;

        // Skip if either character is already marked for removal
        if (charactersToRemove.includes(character1.id) || charactersToRemove.includes(character2.id)) {
          continue;
        }

        // Only process same-type characters
        if (character1.name !== character2.name) continue;

        // Only check collision for same-type characters
        if (!this.physicsEngine.checkCollision(character1, character2)) continue;

        // Get the current character class and find the next one
        const currentCharacterClass = CharacterClass.getByName(character1.name);
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
        this.soundManager.playSoundDebounced(nextCharacterClass.name, 800);
        this.soundManager.playPop();

        // Mark characters for removal
        charactersToRemove.push(character1.id, character2.id);

        // Add new character to the list
        charactersToAdd.push(newCharacter);

        // Add score
        scoreIncrease += nextCharacterClass.points * 10;

        // Add explosion effect
        this.createExplosion(newCharacter.body.position.x, newCharacter.body.position.y);

        // Break out of inner loop since we've found a combination
        break;
      }
    }

    // Remove old characters and their physics bodies
    charactersToRemove.forEach((id) => {
      const character = this.characters.get(id);
      if (character) {
        this.physicsEngine.removeBody(character.body);
        this.characters.delete(id);
      }
    });

    // Add new characters
    charactersToAdd.forEach((character) => {
      this.characters.set(character.id, character);
    });

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
    this.characters.clear();
    this.particles = [];
  }
}

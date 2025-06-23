import type { Body, Engine, World, Render } from "matter-js";

export class CharacterClass {
  private static nextId = 1; // Static counter for unique IDs

  constructor(
    public readonly name: string,
    public readonly radius: number,
    public readonly points: number,
    public readonly displayName: string,
    public readonly tier: number
  ) {}

  // Generate a unique ID
  static generateId(): number {
    return this.nextId++;
  }

  // Static method to get the next character in the evolution chain
  getNextCharacter(): CharacterClass | null {
    const allCharacters = CharacterClass.getAllCharacters();
    const currentIndex = allCharacters.findIndex((c) => c.name === this.name);
    return currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : null;
  }

  // Static method to get all characters
  static getAllCharacters(): CharacterClass[] {
    return [
      new CharacterClass("shrimp-cat", 15, 1, "Trippi Troppi", 0),
      new CharacterClass("capuccino", 20, 2, "Capuccino Assassino", 1),
      new CharacterClass("capybara-coconut", 25, 3, "Burbaloni Lulilolli", 2),
      new CharacterClass("monkey-banana", 30, 4, "Chimpanzini Bananini", 3),
      new CharacterClass("frog-tire", 35, 5, "Boneca Ambalabu", 4),
      new CharacterClass("camel-fridge", 40, 6, "Frigo Camelo", 5),
      new CharacterClass("elephant", 45, 7, "Lirili Larila", 6),
      new CharacterClass("cow", 50, 8, "La Vaca Saturno Saturnita", 7),
      new CharacterClass("baseball-bat", 55, 9, "Tung Tung Tung Sahur", 8),
      new CharacterClass("shark", 60, 10, "Tralalero Tralala", 9),
      new CharacterClass("crocodile", 65, 11, "Bombardino Crocodilo", 10),
      new CharacterClass("big-feet", 70, 12, "Brr Brr Patapim", 11),
    ];
  }

  // Static method to get a character by name
  static getByName(name: string): CharacterClass | undefined {
    return this.getAllCharacters().find((c) => c.name === name);
  }

  // Static method to get a random character (up to a certain tier)
  static getRandom(maxTier: number = 4): CharacterClass {
    const characters = this.getAllCharacters().filter((c) => c.tier <= maxTier);
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }
}

export class Character {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly radius: number,
    public readonly points: number,
    public readonly displayName: string,
    public readonly body: Body
  ) {}
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface GameState {
  score: number;
  characters: Character[];
  currentCharacter: Character | null;
  nextCharacter: CharacterClass | null;
  gameOver: boolean;
  particles: Particle[];
}

export interface PhysicsWorld {
  engine: Engine;
  world: World;
  render: Render;
}

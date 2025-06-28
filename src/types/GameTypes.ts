import type { Body, Engine, World, Render } from "matter-js";
import { GameMode } from "../constants/GameConstants";

export class CharacterClass {
  private static nextId = 1; // Static counter for unique IDs
  public readonly points: number;
  public hasSound: boolean = true;

  constructor(
    public readonly mode: GameMode,
    public readonly name: string,
    public readonly radius: number,
    public readonly displayName: string,
    public readonly tier: number
  ) {
    this.points = tier + 1;
  }

  // Generate a unique ID
  static generateId(): number {
    return this.nextId++;
  }

  // Static method to get the next character in the evolution chain for a specific game mode
  getNextCharacter(): CharacterClass | null {
    const allCharacters = CharacterClass.getAllCharacters(this.mode);
    const currentIndex = allCharacters.findIndex((c) => c.name === this.name);
    return currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : null;
  }

  // Static method to get all characters for a specific game mode
  static getAllCharacters(mode: GameMode): CharacterClass[] {
    switch (mode) {
      case GameMode.ITALIAN_BRAINROT:
        return [
          new ItalianBrainrotCharacterClass("shrimp-cat", 25, "Trippi Troppi", 0),
          new ItalianBrainrotCharacterClass("capuccino", 30, "Capuccino Assassino", 1),
          new ItalianBrainrotCharacterClass("capybara-coconut", 35, "Burbaloni Lulilolli", 2),
          new ItalianBrainrotCharacterClass("monkey-banana", 35, "Chimpanzini Bananini", 3),
          new ItalianBrainrotCharacterClass("frog-tire", 35, "Boneca Ambalabu", 4),
          new ItalianBrainrotCharacterClass("camel-fridge", 45, "Frigo Camelo", 5),
          new ItalianBrainrotCharacterClass("elephant", 50, "Lirili Larila", 6),
          new ItalianBrainrotCharacterClass("cow", 55, "La Vaca Saturno Saturnita", 7),
          new ItalianBrainrotCharacterClass("baseball-bat", 55, "Tung Tung Tung Sahur", 8),
          new ItalianBrainrotCharacterClass("shark", 60, "Tralalero Tralala", 9),
          new ItalianBrainrotCharacterClass("crocodile", 65, "Bombardino Crocodilo", 10),
          new ItalianBrainrotCharacterClass("big-feet", 70, "Brr Brr Patapim", 11),
        ];
      case GameMode.CATS:
        return [
          new CatsCharacterClass("paw", 25, "Paw", 0),
          new CatsCharacterClass("cat1", 30, "Cat 1", 1),
          new CatsCharacterClass("cat2", 35, "Cat 2", 2),
          new CatsCharacterClass("cat3", 40, "Cat 3", 3),
          new CatsCharacterClass("cat4", 45, "Cat 4", 4),
          new CatsCharacterClass("cat5", 50, "Cat 5", 5),
          new CatsCharacterClass("cat6", 55, "Cat 6", 6),
          new CatsCharacterClass("cat7", 60, "Cat 7", 7),
          new CatsCharacterClass("cat8", 65, "Cat 8", 8),
          new CatsCharacterClass("cat9", 70, "Cat 9", 9),
        ];
      case GameMode.CAPYBARA:
        return [
          new CapybaraCharacterClass("capy1", 25, "Capybara 1", 0),
          new CapybaraCharacterClass("capy2", 30, "Capybara 2", 1),
          new CapybaraCharacterClass("capy3", 35, "Capybara 3", 2),
          new CapybaraCharacterClass("capy4", 40, "Capybara 4", 3),
          new CapybaraCharacterClass("capy5", 45, "Capybara 5", 4),
          new CapybaraCharacterClass("capy6", 50, "Capybara 6", 5),
          new CapybaraCharacterClass("capy7", 55, "Capybara 7", 6),
          new CapybaraCharacterClass("capy8", 60, "Capybara 8", 7),
          new CapybaraCharacterClass("capy9", 65, "Capybara 9", 8),
          new CapybaraCharacterClass("capy10", 70, "Capybara 10", 9),
          new CapybaraCharacterClass("capy11", 75, "Capybara 11", 10),
        ];
      case GameMode.GIGA:
        return [
          new GigaCharacterClass("nerd", 25, "Nerd", 0),
          new GigaCharacterClass("skull", 30, "Skull", 1),
          new GigaCharacterClass("doge", 35, "Doge", 2),
          new GigaCharacterClass("blobfish", 40, "Blobfish", 3),
          new GigaCharacterClass("monkey", 45, "Monkey", 4),
          new GigaCharacterClass("tiger", 50, "Tiger", 5),
          new GigaCharacterClass("pig", 55, "Pig", 6),
          new GigaCharacterClass("stone", 60, "Stone", 7),
          new GigaCharacterClass("man", 65, "Man", 8),
          new GigaCharacterClass("big-chungus", 70, "Big Chungus", 9),
          new GigaCharacterClass("giga", 75, "Giga Chad", 10),
        ];
      default:
        return [];
    }
  }

  // Static method to get all characters from all game modes (for backward compatibility)
  static getAllCharactersAllModes(): CharacterClass[] {
    return Object.values(GameMode).flatMap((mode) => this.getAllCharacters(mode));
  }

  // Static method to get a character by name within a specific game mode
  static getByName(name: string, mode: GameMode): CharacterClass | undefined {
    return this.getAllCharacters(mode).find((c) => c.name === name);
  }

  // Static method to get a character by name from all game modes (for backward compatibility)
  static getByNameAllModes(name: string): CharacterClass | undefined {
    return this.getAllCharactersAllModes().find((c) => c.name === name);
  }

  // Static method to get a random character for a specific game mode (up to a certain tier)
  static getRandom(mode: GameMode, maxTier: number = 4): CharacterClass {
    const characters = this.getAllCharacters(mode).filter((c) => c.tier <= maxTier);
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  // Static method to get a random character from all game modes (for backward compatibility)
  static getRandomAllModes(maxTier: number = 4): CharacterClass {
    const characters = this.getAllCharactersAllModes().filter((c) => c.tier <= maxTier);
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
    public readonly body: Body,
    public rotation: number = 0
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

export class ItalianBrainrotCharacterClass extends CharacterClass {
  constructor(name: string, radius: number, displayName: string, tier: number) {
    super(GameMode.ITALIAN_BRAINROT, name, radius, displayName, tier);
  }
}

export class CatsCharacterClass extends CharacterClass {
  constructor(name: string, radius: number, displayName: string, tier: number) {
    super(GameMode.CATS, name, radius, displayName, tier);
  }
}

export class CapybaraCharacterClass extends CharacterClass {
  constructor(name: string, radius: number, displayName: string, tier: number) {
    super(GameMode.CAPYBARA, name, radius, displayName, tier);
    this.hasSound = false;
  }
}

export class GigaCharacterClass extends CharacterClass {
  constructor(name: string, radius: number, displayName: string, tier: number) {
    super(GameMode.GIGA, name, radius, displayName, tier);
    this.hasSound = false;
  }
}

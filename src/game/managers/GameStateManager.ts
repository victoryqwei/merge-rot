import { makeAutoObservable } from "mobx";
import { CharacterClass } from "../../types/GameTypes";
import { CharacterManager } from "../CharacterManager";
import { GameMode } from "../../constants/GameConstants";
import * as Matter from "matter-js";
import type { SuikaGame } from "../SuikaGame";

export interface GameState {
  score: number;
  currentCharacter: CharacterClass | null;
  nextCharacter: CharacterClass | null;
  gameOver: boolean;
  hasStarted: boolean;
}

export interface SerializedCharacter {
  id: number;
  name: string;
  radius: number;
  points: number;
  displayName: string;
  rotation: number;
  characterTypeName: string;
  gameMode: GameMode;
  // Physics data
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
}

export interface SerializedGameState {
  score: number;
  currentCharacterName: string | null;
  currentCharacterMode: GameMode | null;
  nextCharacterName: string | null;
  nextCharacterMode: GameMode | null;
  gameOver: boolean;
  hasStarted: boolean;
  characters: SerializedCharacter[];
  gameMode: GameMode;
  timestamp: number;
}

export class GameStateManager {
  private state: GameState = {
    score: 0,
    currentCharacter: null,
    nextCharacter: null,
    gameOver: false,
    hasStarted: false,
  };

  private characterManager: CharacterManager;
  private gameMode: GameMode;
  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(characterManager: CharacterManager, private game: SuikaGame) {
    makeAutoObservable(this);
    this.characterManager = characterManager;
    this.gameMode = game.getGameMode();
    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    // Auto-save every 5 seconds during gameplay
    this.autoSaveInterval = setInterval(() => {
      if (this.autoSaveEnabled && this.state.hasStarted && !this.state.gameOver) {
        this.saveGameState();
      }
    }, 5000);

    // Save on page unload/refresh
    window.addEventListener("beforeunload", () => {
      if (this.state.hasStarted && !this.state.gameOver) {
        this.saveGameState();
      }
    });

    // Save on visibility change (when user switches tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state.hasStarted && !this.state.gameOver) {
        this.saveGameState();
      }
    });
  }

  private saveGameState(): void {
    try {
      const serializedState = this.serializeGameState();
      localStorage.setItem("suika-game-save", JSON.stringify(serializedState));
    } catch (error) {
      console.error("Failed to save game state:", error);
    }
  }

  private serializeGameState(): SerializedGameState {
    const characters = this.characterManager.getCharacters();
    const serializedCharacters: SerializedCharacter[] = characters.map((char) => {
      const position = char.body.position;
      const velocity = char.body.velocity;

      return {
        id: char.id,
        name: char.name,
        radius: char.radius,
        points: char.points,
        displayName: char.displayName,
        rotation: char.rotation,
        characterTypeName: char.characterType.name,
        gameMode: char.characterType.mode,
        x: position.x,
        y: position.y,
        velocityX: velocity.x,
        velocityY: velocity.y,
        angularVelocity: char.body.angularVelocity,
      };
    });

    return {
      score: this.state.score,
      currentCharacterName: this.state.currentCharacter?.name || null,
      currentCharacterMode: this.state.currentCharacter?.mode || null,
      nextCharacterName: this.state.nextCharacter?.name || null,
      nextCharacterMode: this.state.nextCharacter?.mode || null,
      gameOver: this.state.gameOver,
      hasStarted: this.state.hasStarted,
      characters: serializedCharacters,
      gameMode: this.gameMode,
      timestamp: Date.now(),
    };
  }

  async loadGameState(): Promise<boolean> {
    try {
      const savedData = localStorage.getItem("suika-game-save");
      if (!savedData) {
        return false;
      }

      const serializedState: SerializedGameState = JSON.parse(savedData);

      // Check if the save is recent (within 24 hours)
      const now = Date.now();
      const saveAge = now - serializedState.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (saveAge > maxAge) {
        console.info("Saved game is too old, starting fresh");
        this.clearSavedGame();
        return false;
      }

      // Restore game state
      this.state.score = serializedState.score;
      this.state.gameOver = serializedState.gameOver;
      this.state.hasStarted = serializedState.hasStarted;

      await this.game.setGameMode(serializedState.gameMode);

      // Restore current and next characters
      if (serializedState.currentCharacterName && serializedState.currentCharacterMode) {
        this.state.currentCharacter =
          CharacterClass.getByName(serializedState.currentCharacterName, serializedState.currentCharacterMode) || null;
      }

      if (serializedState.nextCharacterName && serializedState.nextCharacterMode) {
        this.state.nextCharacter = CharacterClass.getByName(serializedState.nextCharacterName, serializedState.nextCharacterMode) || null;
      }

      // Clear existing characters
      this.characterManager.clear();

      // Restore characters
      for (const serializedChar of serializedState.characters) {
        const characterType = CharacterClass.getByName(serializedChar.characterTypeName, serializedChar.gameMode);
        if (characterType) {
          const character = await this.characterManager.createCharacter(characterType, serializedChar.x, serializedChar.y);

          // Restore physics properties
          character.body.velocity.x = serializedChar.velocityX;
          character.body.velocity.y = serializedChar.velocityY;
          Matter.Body.setAngularVelocity(character.body, serializedChar.angularVelocity);
          character.rotation = serializedChar.rotation;

          this.characterManager.addCharacter(character);
        }
      }
      return true;
    } catch (error) {
      console.error("Failed to load game state:", error);
      this.clearSavedGame();
      return false;
    }
  }

  clearSavedGame(): void {
    localStorage.removeItem("suika-game-save");
    console.info("Saved game cleared");
  }

  hasSavedGame(): boolean {
    const savedData = localStorage.getItem("suika-game-save");
    if (!savedData) return false;

    try {
      const serializedState: SerializedGameState = JSON.parse(savedData);
      const now = Date.now();
      const saveAge = now - serializedState.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      return saveAge <= maxAge && serializedState.hasStarted && !serializedState.gameOver;
    } catch {
      return false;
    }
  }

  setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
  }

  enableAutoSave(): void {
    this.autoSaveEnabled = true;
  }

  disableAutoSave(): void {
    this.autoSaveEnabled = false;
  }

  update(deltaTime: number): boolean {
    if (this.state.gameOver) return false;

    // Update physics
    this.characterManager.updateCharacters(deltaTime);

    // Check for character combinations
    this.characterManager.checkCombinations().then((scoreIncrease) => {
      if (scoreIncrease > 0) {
        this.state.score += scoreIncrease;
        // Save after score increase
        if (this.autoSaveEnabled && this.state.hasStarted) {
          this.saveGameState();
        }
      }
    });

    // Update particles
    this.characterManager.updateParticles(deltaTime);

    // Check for game over
    if (this.characterManager.checkGameOver(deltaTime)) {
      this.endGame();
      return false;
    }

    return true;
  }

  generateNextCharacter(): void {
    this.state.currentCharacter = this.state.nextCharacter || this.characterManager.generateRandomCharacter();
    this.state.nextCharacter = this.characterManager.generateRandomCharacter();
  }

  clearCharacters(): void {
    this.state.currentCharacter = null;
    this.state.nextCharacter = null;
  }

  setHasStarted(hasStarted: boolean): void {
    this.state.hasStarted = hasStarted;
    if (hasStarted) {
      // Save when game starts
      setTimeout(() => this.saveGameState(), 1000);
    }
  }

  endGame(): void {
    this.state.gameOver = true;
    // Clear saved game when game ends
    this.clearSavedGame();
  }

  restart(): void {
    this.state.score = 0;
    this.state.currentCharacter = null;
    this.state.gameOver = false;
    this.state.hasStarted = false;
    this.characterManager.clear();
    this.generateNextCharacter();
    // Clear saved game on restart
    this.clearSavedGame();
  }

  addScore(points: number): void {
    this.state.score += points;
  }

  getScore(): number {
    return this.state.score;
  }

  getCurrentCharacter(): CharacterClass | null {
    return this.state.currentCharacter;
  }

  getNextCharacter(): CharacterClass | null {
    return this.state.nextCharacter;
  }

  isGameOver(): boolean {
    return this.state.gameOver;
  }

  hasStarted(): boolean {
    return this.state.hasStarted;
  }

  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

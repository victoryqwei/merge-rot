import { makeAutoObservable } from "mobx";
import { CharacterClass } from "../../types/GameTypes";
import { CharacterManager } from "../CharacterManager";

export interface GameState {
  score: number;
  currentCharacter: CharacterClass | null;
  nextCharacter: CharacterClass | null;
  gameOver: boolean;
  hasStarted: boolean;
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

  constructor(characterManager: CharacterManager) {
    makeAutoObservable(this);
    this.characterManager = characterManager;
  }

  update(deltaTime: number): boolean {
    if (this.state.gameOver) return false;

    // Update physics
    this.characterManager.updateCharacters(deltaTime);

    // Check for character combinations
    this.characterManager.checkCombinations().then((scoreIncrease) => {
      if (scoreIncrease > 0) {
        this.state.score += scoreIncrease;
      }
    });

    // Update particles
    this.characterManager.updateParticles(deltaTime);

    // Check for game over
    if (this.characterManager.checkGameOver()) {
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
  }

  endGame(): void {
    this.state.gameOver = true;
  }

  restart(): void {
    this.state.score = 0;
    this.state.currentCharacter = null;
    this.state.gameOver = false;
    this.state.hasStarted = false;
    this.characterManager.clear();
    this.generateNextCharacter();
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
}

import { makeAutoObservable } from "mobx";
import { CharacterClass } from "../types/GameTypes";
import { SuikaGame } from "../game/SuikaGame";

export class GameStore {
  // Game state
  score: number = 0;
  nextCharacter: CharacterClass | null = null;
  isLoading: boolean = true;
  gameOver: boolean = false;
  finalScore: number = 0;
  hasStarted: boolean = false;

  // Game instance reference
  private gameInstance: SuikaGame | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setGameInstance(game: SuikaGame) {
    this.gameInstance = game;
  }

  setScore(score: number) {
    this.score = score;
  }

  setNextCharacter(character: CharacterClass) {
    this.nextCharacter = character;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setGameOver(gameOver: boolean, finalScore: number = 0) {
    this.gameOver = gameOver;
    if (gameOver) {
      this.finalScore = finalScore;
    }
  }

  setHasStarted(started: boolean) {
    this.hasStarted = started;
  }

  resetGame() {
    this.score = 0;
    this.nextCharacter = null;
    this.gameOver = false;
    this.finalScore = 0;
    this.hasStarted = false;
    if (this.gameInstance) {
      this.gameInstance.restart();
    }
  }

  // Computed values
  get isGameActive() {
    return !this.gameOver && !this.isLoading;
  }

  get displayScore() {
    return this.gameOver ? this.finalScore : this.score;
  }

  get nextCharacterName() {
    return this.isLoading ? "Loading..." : this.nextCharacter?.name || "None";
  }
}

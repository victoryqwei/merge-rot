import { SuikaGame } from "../game/SuikaGame";
import { GameStore } from "../stores/GameStore";
import { CharacterClass } from "../types/GameTypes";

export class GameService {
  private game: SuikaGame | null = null;
  private gameStore: GameStore;

  constructor(gameStore: GameStore) {
    this.gameStore = gameStore;
  }

  initializeGame(canvas: HTMLCanvasElement): void {
    if (this.game) {
      // Game already initialized
      return;
    }

    this.gameStore.setLoading(true);

    // Initialize the game
    this.game = new SuikaGame(canvas);

    // Set up game callbacks to update the store
    this.game.setScoreCallback((score: number) => {
      this.gameStore.setScore(score);
    });

    this.game.setNextCharacterCallback((character: CharacterClass) => {
      this.gameStore.setNextCharacter(character);
    });

    this.game.setGameOverCallback((finalScore: number) => {
      this.gameStore.setGameOver(true, finalScore);
    });

    // Store the game instance in the store
    this.gameStore.setGameInstance(this.game);

    // Game is ready
    this.gameStore.setLoading(false);
  }

  restartGame(): void {
    if (this.game) {
      this.game.restart();
      this.gameStore.resetGame();
    }
  }

  getGame(): SuikaGame | null {
    return this.game;
  }
}

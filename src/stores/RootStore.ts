import { GameStore } from "./GameStore";

export class RootStore {
  gameStore: GameStore;

  constructor() {
    this.gameStore = new GameStore();
  }
}

// Create a singleton instance
export const rootStore = new RootStore();

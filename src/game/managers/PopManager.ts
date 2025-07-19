import { makeAutoObservable } from "mobx";

export interface PopState {
  cooldown: number;
  isPopMode: boolean;
}

export class PopManager {
  constructor() {
    makeAutoObservable(this);
  }

  private state: PopState = {
    cooldown: 0,
    isPopMode: false,
  };

  private onPopCharacter?: (x: number, y: number) => boolean;

  setOnPopCharacter(callback: (x: number, y: number) => boolean): void {
    this.onPopCharacter = callback;
  }

  update(deltaTime: number): void {
    if (this.state.cooldown > 0) {
      this.state.cooldown -= deltaTime;
      if (this.state.cooldown <= 0) {
        this.state.cooldown = 0;
      }
    }
  }

  startPopMode(): void {
    if (this.state.cooldown > 0) {
      return;
    }

    this.state.isPopMode = true;
  }

  cancelPopMode(): void {
    this.state.isPopMode = false;
  }

  attemptPop(x: number, y: number): boolean {
    if (!this.state.isPopMode || this.state.cooldown > 0) return false;

    if (this.onPopCharacter && this.onPopCharacter(x, y)) {
      // Successfully popped a character
      this.state.isPopMode = false;
      this.state.cooldown = 30; // 30 second cooldown
      return true;
    }

    return false;
  }

  isPopMode(): boolean {
    return this.state.isPopMode;
  }

  getCooldown(): number {
    return Math.ceil(this.state.cooldown);
  }

  canPop(): boolean {
    return this.state.cooldown <= 0;
  }

  resetPopCooldown(): void {
    this.state.cooldown = 0;
  }
}

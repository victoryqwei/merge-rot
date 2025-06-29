import { GAME_CONFIG } from "../../constants/GameConstants";
import type { SuikaGame } from "../SuikaGame";

export interface AnimationState {
  characterAnimationProgress: number;
  dropCooldownTime: number;
  dropQueued: boolean;
  lastDropTime: number;
}

export class AnimationManager {
  private state: AnimationState = {
    characterAnimationProgress: 0,
    dropCooldownTime: 0,
    dropQueued: false,
    lastDropTime: 0,
  };

  constructor(private game: SuikaGame) {}

  update(deltaTime: number): void {
    // Update cooldown timer
    if (this.state.dropCooldownTime > 0) {
      this.state.dropCooldownTime -= deltaTime;
    } else {
      // Animate character when ready to drop
      this.state.characterAnimationProgress = Math.min(1, this.state.characterAnimationProgress + deltaTime * 3); // 3 units per second
    }
  }

  startDropCooldown(): void {
    this.state.dropCooldownTime = GAME_CONFIG.DROP_COOLDOWN_TIME / 1000; // Convert ms to seconds
  }

  resetCharacterAnimation(): void {
    this.state.characterAnimationProgress = 0;
  }

  getCharacterAnimationProgress(): number {
    return this.state.characterAnimationProgress;
  }

  getDropCooldownTime(): number {
    return this.state.dropCooldownTime;
  }

  canDrop(): boolean {
    return (this.state.dropCooldownTime <= 0 && this.state.characterAnimationProgress >= 1) || this.game.isDebugMode();
  }

  queueDrop(): boolean {
    const now = Date.now();
    const timeSinceLastDrop = now - this.state.lastDropTime;

    if (this.state.dropQueued || timeSinceLastDrop < GAME_CONFIG.DROP_COOLDOWN_TIME - 100) {
      return false;
    }

    this.state.dropQueued = true;
    return true;
  }

  recordDropExecution(): void {
    this.state.lastDropTime = Date.now();
  }

  isDropQueued(): boolean {
    return this.state.dropQueued;
  }

  clearDropQueue(): void {
    this.state.dropQueued = false;
  }

  getTimeSinceLastDrop(): number {
    return Date.now() - this.state.lastDropTime;
  }

  reset(): void {
    this.state.characterAnimationProgress = 0;
    this.state.dropCooldownTime = 0;
    this.state.dropQueued = false;
    this.state.lastDropTime = 0;
  }
}

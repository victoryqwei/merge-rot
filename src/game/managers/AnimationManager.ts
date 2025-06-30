import { GAME_CONFIG } from "../../constants/GameConstants";
import type { SuikaGame } from "../SuikaGame";

export interface AnimationState {
  characterAnimationProgress: number;
  dropCooldownTime: number;
  dropQueued: boolean;
  lastDropTime: number;
  // Combo system
  lastMergeTime: number;
  comboMultiplier: number;
  comboDisplayVisible: boolean;
  comboDisplayTimer: number;
}

export class AnimationManager {
  private state: AnimationState = {
    characterAnimationProgress: 0,
    dropCooldownTime: 0,
    dropQueued: false,
    lastDropTime: 0,
    // Combo system
    lastMergeTime: 0,
    comboMultiplier: 1,
    comboDisplayVisible: false,
    comboDisplayTimer: 0,
  };

  constructor(private game: SuikaGame) {}

  update(deltaTime: number): void {
    // Cap delta time to prevent large jumps when window regains focus
    const maxDeltaTime = 1 / 30; // Cap to 30 FPS equivalent
    const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);

    // Update cooldown timer
    if (this.state.dropCooldownTime > 0) {
      this.state.dropCooldownTime -= clampedDeltaTime;
    } else {
      // Animate character when ready to drop
      this.state.characterAnimationProgress = Math.min(1, this.state.characterAnimationProgress + clampedDeltaTime * 3); // 3 units per second
    }

    // Update combo display timer
    if (this.state.comboDisplayTimer > 0) {
      this.state.comboDisplayTimer -= clampedDeltaTime;
      if (this.state.comboDisplayTimer <= 0) {
        this.state.comboDisplayVisible = false;
      }
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
    // Reset combo system
    this.state.lastMergeTime = 0;
    this.state.comboMultiplier = 1;
    this.state.comboDisplayVisible = false;
    this.state.comboDisplayTimer = 0;
  }

  // Combo system methods
  recordMerge(): void {
    const now = Date.now();
    const timeSinceLastMerge = now - this.state.lastMergeTime;

    // If merge happened within 1 second of the last merge, increase combo
    if (timeSinceLastMerge <= 1000) {
      this.state.comboMultiplier = this.state.comboMultiplier + 1;
    } else {
      // Reset combo if more than 1 second has passed
      this.state.comboMultiplier = 1;
    }

    this.state.lastMergeTime = now;
    this.state.comboDisplayVisible = true;
    this.state.comboDisplayTimer = 3.0;
  }

  getComboMultiplier(): number {
    return this.state.comboMultiplier;
  }

  isComboDisplayVisible(): boolean {
    return this.state.comboDisplayVisible;
  }

  resetCombo(): void {
    this.state.comboMultiplier = 1;
    this.state.comboDisplayVisible = false;
    this.state.comboDisplayTimer = 0;
  }
}

import { GAME_CONFIG } from "../../constants/GameConstants";

export interface AnimationState {
  characterAnimationProgress: number;
  dropCooldownTime: number;
}

export class AnimationManager {
  private state: AnimationState = {
    characterAnimationProgress: 0,
    dropCooldownTime: 0,
  };

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
    return this.state.dropCooldownTime <= 0 && this.state.characterAnimationProgress >= 1;
  }

  reset(): void {
    this.state.characterAnimationProgress = 0;
    this.state.dropCooldownTime = 0;
  }
}

import { makeAutoObservable } from "mobx";
import { GAME_CONFIG } from "../../constants/GameConstants";

export interface ShakeState {
  intensity: number;
  duration: number;
  timer: number;
  angle: number;
  time: number;
  velocity: number;
  timerTime: number;
  liftY: number;
  liftTime: number;
  endTime: number;
}

export class ShakeManager {
  constructor() {
    makeAutoObservable(this);
  }

  private state: ShakeState = {
    intensity: 0,
    duration: 0,
    timer: 0,
    angle: 0,
    time: 0,
    velocity: 0,
    timerTime: 0,
    liftY: 0,
    liftTime: 0,
    endTime: 0,
  };

  private onShakeUpdate?: (angle: number, velocity: number) => void;

  setOnShakeUpdate(callback: (angle: number, velocity: number) => void): void {
    this.onShakeUpdate = callback;
  }

  update(deltaTime: number): void {
    // Cap delta time to prevent large jumps when window regains focus
    const clampedDeltaTime = Math.min(deltaTime, GAME_CONFIG.MAX_DELTA_TIME);

    if (this.state.timerTime > 0) {
      this.state.timerTime -= clampedDeltaTime;
      this.state.time += clampedDeltaTime * 6; // 6 radians per second oscillation speed
      this.state.liftTime += clampedDeltaTime; // Lift animation speed in seconds
      const progress = this.state.timerTime / this.state.duration;
      const intensity = this.state.intensity * progress;

      // Calculate shake angle and velocity
      const previousAngle = this.state.angle;
      this.state.angle = (Math.sin(this.state.time) * intensity * Math.PI) / 180; // Convert to radians
      this.state.velocity = this.state.angle - previousAngle; // Calculate velocity

      // Calculate lift animation: up for 200ms, hold, then down
      const liftDuration = 0.2; // 200ms = 0.2 seconds
      const liftProgress = Math.min(this.state.liftTime, liftDuration) / liftDuration;

      if (liftProgress < 1) {
        // Going up phase (0-200ms)
        this.state.liftY = liftProgress * 50; // 0 to 50px
      } else {
        // Hold phase - stay at 50px while shaking continues
        this.state.liftY = 50;
      }

      // Apply shake to physics based on actual movement
      if (this.onShakeUpdate) {
        this.onShakeUpdate(this.state.angle, this.state.velocity);
      }
    } else if (this.state.liftY > 0) {
      // Shaking is done, but we need to go down
      if (this.state.endTime === 0) {
        // First frame of going down - reset the timer
        this.state.endTime = this.state.liftTime;
        this.state.liftTime = 0;
      }

      this.state.liftTime += clampedDeltaTime;
      const downDuration = 0.2; // 200ms = 0.2 seconds
      const downProgress = Math.min(this.state.liftTime / downDuration, 1);

      this.state.liftY = 50 * (1 - downProgress);

      // Reset everything when we're done going down
      if (downProgress >= 1) {
        this.resetShakeState();
      }
    } else {
      this.resetShakeState();
    }
  }

  private resetShakeState(): void {
    this.state.angle = 0;
    this.state.velocity = 0;
    this.state.time = 0;
    this.state.liftY = 0;
    this.state.liftTime = 0;
    this.state.endTime = 0;
    this.state.timerTime = 0;
  }

  shake(intensity: number = 20, duration: number = 3000): void {
    this.state.intensity = intensity;
    this.state.duration = duration / 1000; // Convert ms to seconds
    this.state.timerTime = duration / 1000; // Convert ms to seconds
    this.state.time = 0; // Reset shake time
    this.state.liftTime = 0; // Reset lift time
  }

  getShakeAngle(): number {
    return this.state.angle;
  }

  getShakeLiftY(): number {
    return this.state.liftY;
  }

  isShaking(): boolean {
    return this.state.timerTime > 0 || this.state.liftY > 0;
  }
}

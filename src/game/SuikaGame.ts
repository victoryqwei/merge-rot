import { CharacterClass } from "../types/GameTypes";
import { CharacterManager } from "./CharacterManager";
import { Renderer } from "../utils/Renderer";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager } from "../utils/SoundManager";
import { GAME_CONFIG } from "../constants/GameConstants";
import { makeAutoObservable } from "mobx";

export class SuikaGame {
  public canvas: HTMLCanvasElement | null = null;
  renderer?: Renderer;
  public physicsEngine: PhysicsEngine;
  public characterManager: CharacterManager;
  public soundManager: SoundManager;
  public score: number = 0;
  public currentCharacter: CharacterClass | null = null;
  public nextCharacter: CharacterClass | null = null;
  public mouseX: number = GAME_CONFIG.BOX_WIDTH / 2;
  public gameOver: boolean = false;
  public dropCooldown: number = 0;
  public hasStarted: boolean = false;
  public characterAnimationProgress: number = 0; // 0 to 1 for animation
  public dropCooldownTime: number = 0; // Time-based cooldown in seconds

  // Mobile drag and drop properties
  public isDragging: boolean = false;
  public dragStartX: number = 0;
  public dragStartY: number = 0;
  public isMobile: boolean = false;

  // Shake properties
  public shakeIntensity: number = 0;
  public shakeDuration: number = 0;
  public shakeTimer: number = 0;
  public shakeAngle: number = 0;
  public shakeTime: number = 0; // For smooth oscillation
  public shakeVelocity: number = 0; // For physics calculations
  public shakeTimerTime: number = 0; // Time-based shake timer in seconds

  // Lift animation properties
  public shakeLiftY: number = 0; // Current lift offset in pixels
  public shakeLiftTime: number = 0; // Time for lift animation
  public shakeEndTime: number = 0; // Time when shaking ended (for going down phase)

  // Delta time tracking for frame-rate independent animations
  private lastFrameTime: number = 0;
  private deltaTime: number = 0; // Time in seconds since last frame

  constructor(canvas: HTMLCanvasElement | null) {
    makeAutoObservable(this);
    this.physicsEngine = new PhysicsEngine();
    this.soundManager = new SoundManager();
    this.characterManager = new CharacterManager(this.physicsEngine, this.soundManager);
    if (canvas) this.setCanvas(canvas);
  }

  private detectMobile(): void {
    // Detect if the device supports touch events
    this.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.init();
  }

  private init(): void {
    this.detectMobile();
    this.generateNextCharacter();
    this.setupEventListeners();
    this.gameLoop();

    // Start background music
    this.soundManager.setOnLoadComplete(() => {
      this.soundManager.playBackgroundMusic();
    });
  }

  private setupEventListeners(): void {
    if (this.isMobile) {
      this.setupMobileEvents();
    } else {
      this.setupDesktopEvents();
    }

    // Handle window resize for high DPI displays
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Handle tab focus/blur for background music
    window.addEventListener("blur", () => {
      this.soundManager.pauseBackgroundMusic();
    });

    window.addEventListener("focus", () => {
      this.soundManager.resumeBackgroundMusic();
    });
  }

  private setupDesktopEvents(): void {
    // Track mouse movement
    this.canvas?.addEventListener("mousemove", (e) => {
      const mouseX = this.getMouseX(e.clientX);
      if (mouseX !== null) {
        this.mouseX = mouseX;
      }
    });

    // Add character on click
    this.canvas?.addEventListener("click", async (e) => {
      await this.handleDrop(e.clientX);
    });
  }

  private setupMobileEvents(): void {
    // Track touch movement
    this.canvas?.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault(); // Prevent scrolling
        if (e.touches.length > 0) {
          const mouseX = this.getMouseX(e.touches[0].clientX);
          if (mouseX !== null) {
            this.mouseX = mouseX;
          }
        }
      },
      { passive: false }
    );

    // Start drag on touch start
    this.canvas?.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          this.dragStartX = e.touches[0].clientX;
          this.dragStartY = e.touches[0].clientY;
          this.isDragging = true;
        }
      },
      { passive: false }
    );

    // End drag and drop on touch end
    this.canvas?.addEventListener(
      "touchend",
      async (e) => {
        e.preventDefault();
        if (this.isDragging) {
          await this.handleDrop(this.mouseX + GAME_CONFIG.PADDING); // Use current mouseX position
          this.isDragging = false;
        }
      },
      { passive: false }
    );

    // Handle touch cancel
    this.canvas?.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault();
        this.isDragging = false;
      },
      { passive: false }
    );
  }

  private getMouseX(clientX: number): number | null {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return null;

    let mouseX = clientX - rect.left - GAME_CONFIG.PADDING;

    // Constrain mouse position by character radius to prevent going past box boundaries
    if (this.currentCharacter) {
      const radius = this.currentCharacter.radius;
      mouseX = Math.max(radius, Math.min(GAME_CONFIG.BOX_WIDTH - radius, mouseX));
    }

    return mouseX + GAME_CONFIG.PADDING;
  }

  private async handleDrop(clientX: number): Promise<void> {
    if (
      this.gameOver ||
      !this.currentCharacter ||
      this.dropCooldownTime > 0 ||
      this.characterAnimationProgress < 1 ||
      this.shakeTimerTime > 0
    )
      return;

    const x = this.getMouseX(clientX);
    if (x === null) return;

    // Drop at fixed Y position (just above the game over line)
    const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

    // Create and add the character at the restricted position
    const character = await this.characterManager.createCharacter(this.currentCharacter, x, dropY);
    this.characterManager.addCharacter(character);

    // Start cooldown timer (time-based)
    this.dropCooldownTime = GAME_CONFIG.DROP_COOLDOWN_TIME / 1000; // Convert ms to seconds

    this.setHasStarted(true);

    // Generate next character
    this.generateNextCharacter();
  }

  private handleResize(): void {
    // Re-setup the canvas for high DPI if needed
    const pixelRatio = this.renderer?.getPixelRatio() || 1;

    // Update canvas size
    if (this.canvas) {
      this.canvas.width = GAME_CONFIG.CANVAS_WIDTH * pixelRatio;
      this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT * pixelRatio;

      // Set CSS size back to original dimensions
      this.canvas.style.width = GAME_CONFIG.CANVAS_WIDTH + "px";
      this.canvas.style.height = GAME_CONFIG.CANVAS_HEIGHT + "px";
    }
  }

  private setHasStarted(hasStarted: boolean): void {
    this.hasStarted = hasStarted;
  }

  private generateNextCharacter(): void {
    this.currentCharacter = this.nextCharacter || this.characterManager.generateRandomCharacter();
    this.characterAnimationProgress = 0; // Reset animation
    this.nextCharacter = this.characterManager.generateRandomCharacter();
  }

  private async update(): Promise<void> {
    if (this.gameOver) return;

    // Update shake
    if (this.shakeTimerTime > 0) {
      this.shakeTimerTime -= this.deltaTime;
      this.shakeTime += this.deltaTime * 6; // 6 radians per second oscillation speed
      this.shakeLiftTime += this.deltaTime; // Lift animation speed in seconds
      const progress = this.shakeTimerTime / this.shakeDuration;
      const intensity = this.shakeIntensity * progress;

      // Calculate shake angle and velocity
      const previousAngle = this.shakeAngle;
      this.shakeAngle = (Math.sin(this.shakeTime) * intensity * Math.PI) / 180; // Convert to radians
      this.shakeVelocity = this.shakeAngle - previousAngle; // Calculate velocity

      // Calculate lift animation: up for 200ms, hold, then down
      const liftDuration = 0.2; // 200ms = 0.2 seconds
      const liftProgress = Math.min(this.shakeLiftTime, liftDuration) / liftDuration;

      if (liftProgress < 1) {
        // Going up phase (0-200ms)
        this.shakeLiftY = liftProgress * 50; // 0 to 50px
      } else {
        // Hold phase - stay at 50px while shaking continues
        this.shakeLiftY = 50;
      }

      // Apply shake to physics based on actual movement
      this.physicsEngine.applyShake(this.shakeAngle, this.shakeVelocity);
    } else if (this.shakeLiftY > 0) {
      // Shaking is done, but we need to go down
      if (this.shakeEndTime === 0) {
        // First frame of going down - reset the timer
        this.shakeEndTime = this.shakeLiftTime;
        this.shakeLiftTime = 0;
      }

      this.shakeLiftTime += this.deltaTime;
      const downDuration = 0.2; // 200ms = 0.2 seconds
      const downProgress = Math.min(this.shakeLiftTime / downDuration, 1);

      this.shakeLiftY = 50 * (1 - downProgress);

      // Reset everything when we're done going down
      if (downProgress >= 1) {
        this.shakeAngle = 0;
        this.shakeVelocity = 0;
        this.shakeTime = 0;
        this.shakeLiftY = 0;
        this.shakeLiftTime = 0;
        this.shakeEndTime = 0;
        this.shakeTimerTime = 0;
      }
    } else {
      this.shakeAngle = 0;
      this.shakeVelocity = 0;
      this.shakeTime = 0;
      this.shakeLiftY = 0;
      this.shakeLiftTime = 0;
      this.shakeEndTime = 0;
      this.shakeTimerTime = 0;
    }

    // Update cooldown timer
    if (this.dropCooldownTime > 0) {
      this.dropCooldownTime -= this.deltaTime;
    } else {
      // Animate character when ready to drop
      this.characterAnimationProgress = Math.min(1, this.characterAnimationProgress + this.deltaTime * 3); // 3 units per second
    }

    // Update physics
    this.characterManager.updateCharacters();

    // Check for character combinations
    const scoreIncrease = await this.characterManager.checkCombinations();
    if (scoreIncrease > 0) {
      this.score += scoreIncrease;
    }

    // Update particles
    this.characterManager.updateParticles(this.deltaTime);

    // Check for game over
    if (this.characterManager.checkGameOver()) {
      this.endGame();
    }
  }

  private draw(): void {
    this.renderer?.clear();
    this.renderer?.drawBox();

    // Draw current character preview and drop indicator
    if (this.currentCharacter && !this.gameOver && this.shakeTimerTime === 0) {
      const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

      // Show drop indicator when character is fully animated and ready
      // On mobile, also show when dragging
      if (this.characterAnimationProgress >= 1 && (this.isMobile ? this.isDragging : true)) {
        this.renderer?.drawDropIndicator(this.mouseX, dropY);
      }

      // Draw animated character preview
      // On mobile, show a different visual state when dragging
      const animationProgress = this.isMobile && this.isDragging ? 1 : this.characterAnimationProgress;
      this.renderer?.drawAnimatedMouseCursor(this.mouseX, dropY, this.currentCharacter, animationProgress, 1);
    }

    // Draw characters
    for (const character of this.characterManager.getCharacters()) {
      this.renderer?.drawCharacter(character);
    }

    // Draw particles
    for (const particle of this.characterManager.getParticles()) {
      this.renderer?.drawParticle(particle);
    }

    // Restore canvas state if shake was applied
    if (this.shakeAngle !== 0) {
      this.renderer?.restoreShakeRotation();
    }
  }

  private gameLoop(): void {
    const currentTime = performance.now();

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }

    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    this.update().then(() => {
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    });
  }

  private endGame(): void {
    this.gameOver = true;
  }

  public getScore(): number {
    return this.score;
  }

  public setVolume(volume: number): void {
    this.soundManager.setVolume(volume);
  }

  public getVolume(): number {
    return this.soundManager.getVolume();
  }

  public setMusicVolume(volume: number): void {
    this.soundManager.setMusicVolume(volume);
  }

  public getMusicVolume(): number {
    return this.soundManager.getMusicVolume();
  }

  public stopBackgroundMusic(): void {
    this.soundManager.stopBackgroundMusic();
  }

  public playBackgroundMusic(): void {
    this.soundManager.playBackgroundMusic();
  }

  public restart(): void {
    this.score = 0;
    this.currentCharacter = null;
    this.gameOver = false;
    this.dropCooldownTime = 0;
    this.isDragging = false;
    this.characterManager.clear();
    this.generateNextCharacter();
  }

  public shake(intensity: number = 20, duration: number = 3000): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration / 1000; // Convert ms to seconds
    this.shakeTimerTime = duration / 1000; // Convert ms to seconds
    this.shakeTime = 0; // Reset shake time
    this.shakeLiftTime = 0; // Reset lift time
  }

  public getShakeAngle(): number {
    return this.shakeAngle;
  }

  public getShakeLiftY(): number {
    return this.shakeLiftY;
  }

  public getIsMobile(): boolean {
    return this.isMobile;
  }

  public getIsDragging(): boolean {
    return this.isDragging;
  }
}

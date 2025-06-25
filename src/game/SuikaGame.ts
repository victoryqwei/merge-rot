import { CharacterClass } from "../types/GameTypes";
import { CharacterManager } from "./CharacterManager";
import { Renderer } from "../utils/Renderer";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager } from "../utils/SoundManager";
import { GAME_CONFIG } from "../constants/GameConstants";
import { makeAutoObservable } from "mobx";

// Import managers
import { InputManager } from "./managers/InputManager";
import { ShakeManager } from "./managers/ShakeManager";
import { AnimationManager } from "./managers/AnimationManager";
import { GameStateManager } from "./managers/GameStateManager";
import { GameLoop } from "./managers/GameLoop";

export class SuikaGame {
  public canvas: HTMLCanvasElement | null = null;
  private renderer?: Renderer;
  private physicsEngine: PhysicsEngine;
  private characterManager: CharacterManager;
  private soundManager: SoundManager;

  // Managers
  private inputManager: InputManager;
  private shakeManager: ShakeManager;
  private animationManager: AnimationManager;
  private gameStateManager: GameStateManager;
  private gameLoop: GameLoop;

  constructor(canvas: HTMLCanvasElement | null) {
    makeAutoObservable(this);

    // Initialize core systems
    this.physicsEngine = new PhysicsEngine();
    this.soundManager = new SoundManager();
    this.characterManager = new CharacterManager(this.physicsEngine, this.soundManager);

    // Initialize managers
    this.inputManager = new InputManager();
    this.shakeManager = new ShakeManager();
    this.animationManager = new AnimationManager();
    this.gameStateManager = new GameStateManager(this.characterManager);

    // Set up manager connections
    this.setupManagerConnections();

    // Initialize game loop
    this.gameLoop = new GameLoop({
      update: this.update.bind(this),
      draw: this.draw.bind(this),
    });

    if (canvas) this.setCanvas(canvas);
  }

  private setupManagerConnections(): void {
    // Connect shake manager to physics engine
    this.shakeManager.setOnShakeUpdate((angle, velocity) => {
      this.physicsEngine.applyShake(angle, velocity);
    });

    // Connect input manager drop callback
    this.inputManager.setOnDrop(this.handleDrop.bind(this));
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.inputManager.setCanvas(canvas);
    this.init();
  }

  private init(): void {
    this.gameStateManager.generateNextCharacter();
    this.setupWindowEvents();
    this.gameLoop.start();

    // Start background music
    this.soundManager.setOnLoadComplete(() => {
      this.soundManager.playBackgroundMusic();
    });
  }

  private setupWindowEvents(): void {
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

  private async handleDrop(): Promise<void> {
    if (
      this.gameStateManager.isGameOver() ||
      !this.gameStateManager.getCurrentCharacter() ||
      !this.animationManager.canDrop() ||
      this.shakeManager.isShaking()
    )
      return;

    // Use the current mouseX position from InputManager instead of recalculating
    const x = this.inputManager.getCurrentMouseX();
    if (x === null) return;

    // Drop at fixed Y position (just above the game over line)
    const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

    // Create and add the character at the restricted position
    const character = await this.characterManager.createCharacter(this.gameStateManager.getCurrentCharacter()!, x, dropY);
    this.characterManager.addCharacter(character);

    // Start cooldown timer
    this.animationManager.startDropCooldown();
    this.gameStateManager.setHasStarted(true);

    // Generate next character
    this.gameStateManager.generateNextCharacter();
    this.animationManager.resetCharacterAnimation();
    this.inputManager.setCurrentCharacter(this.gameStateManager.getCurrentCharacter());
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

  private async update(deltaTime: number): Promise<void> {
    // Update all managers
    this.shakeManager.update(deltaTime);
    this.animationManager.update(deltaTime);
    this.gameStateManager.update(deltaTime);
  }

  private draw(): void {
    this.renderer?.clear();
    this.renderer?.drawBox();

    // Draw current character preview and drop indicator
    const currentCharacter = this.gameStateManager.getCurrentCharacter();
    if (currentCharacter && !this.gameStateManager.isGameOver() && !this.shakeManager.isShaking()) {
      const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

      // Show drop indicator when character is fully animated and ready
      // On mobile, also show when dragging
      if (this.animationManager.canDrop() && (this.inputManager.isMobile() ? this.inputManager.isDragging() : true)) {
        this.renderer?.drawDropIndicator(this.inputManager.getCurrentMouseX(), dropY);
      }

      // Draw animated character preview
      // On mobile, show a different visual state when dragging
      const animationProgress =
        this.inputManager.isMobile() && this.inputManager.isDragging() ? 1 : this.animationManager.getCharacterAnimationProgress();
      this.renderer?.drawAnimatedMouseCursor(this.inputManager.getCurrentMouseX(), dropY, currentCharacter, animationProgress, 1);
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
    if (this.shakeManager.getShakeAngle() !== 0) {
      this.renderer?.restoreShakeRotation();
    }
  }

  // Public API methods
  public getScore(): number {
    return this.gameStateManager.getScore();
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
    this.gameStateManager.restart();
    this.animationManager.reset();
    this.inputManager.resetDragState();
    this.inputManager.setCurrentCharacter(this.gameStateManager.getCurrentCharacter());
  }

  public shake(intensity: number = 20, duration: number = 3000): void {
    this.shakeManager.shake(intensity, duration);
  }

  public getShakeAngle(): number {
    return this.shakeManager.getShakeAngle();
  }

  public getShakeLiftY(): number {
    return this.shakeManager.getShakeLiftY();
  }

  public getIsMobile(): boolean {
    return this.inputManager.isMobile();
  }

  public getIsDragging(): boolean {
    return this.inputManager.isDragging();
  }

  // Getters for React components
  public get hasStarted(): boolean {
    return this.gameStateManager.hasStarted();
  }

  public get gameOver(): boolean {
    return this.gameStateManager.isGameOver();
  }

  public get currentCharacter(): CharacterClass | null {
    return this.gameStateManager.getCurrentCharacter();
  }

  public get nextCharacter(): CharacterClass | null {
    return this.gameStateManager.getNextCharacter();
  }

  public get mouseX(): number {
    return this.inputManager.getCurrentMouseX();
  }

  public get characterAnimationProgress(): number {
    return this.animationManager.getCharacterAnimationProgress();
  }

  public get dropCooldownTime(): number {
    return this.animationManager.getDropCooldownTime();
  }
}

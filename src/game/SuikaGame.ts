import { CharacterClass } from "../types/GameTypes";
import { CharacterManager } from "./CharacterManager";
import { Renderer } from "../utils/Renderer";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager, Sound } from "../utils/SoundManager";
import { GAME_CONFIG, GameMode } from "../constants/GameConstants";
import { SettingsManager } from "../utils/SettingsManager";
import { makeAutoObservable } from "mobx";

// Import managers
import { InputManager } from "./managers/InputManager";
import { ShakeManager } from "./managers/ShakeManager";
import { AnimationManager } from "./managers/AnimationManager";
import { GameStateManager } from "./managers/GameStateManager";
import { GameLoop } from "./managers/GameLoop";
import { PopManager } from "./managers/PopManager";

export class SuikaGame {
  public canvas: HTMLCanvasElement | null = null;
  private renderer?: Renderer;
  private physicsEngine: PhysicsEngine;
  private characterManager: CharacterManager;
  private soundManager: SoundManager;
  private gameMode: GameMode;
  private debugMode: boolean = false;

  // Loading state
  public isLoading: boolean = true;
  public loadingProgress: number = 0;

  // Managers
  private inputManager: InputManager;
  private shakeManager: ShakeManager;
  private animationManager: AnimationManager;
  private gameStateManager: GameStateManager;
  private gameLoop: GameLoop;
  private popManager: PopManager;

  constructor(canvas: HTMLCanvasElement | null, gameMode: GameMode = GameMode.ITALIAN_BRAINROT) {
    makeAutoObservable(this);

    // Load the last played gamemode from settings, fallback to provided gameMode
    const settings = SettingsManager.getSettings();
    this.gameMode = settings.lastPlayedGameMode || gameMode;

    // Initialize core systems
    this.physicsEngine = new PhysicsEngine();
    this.soundManager = new SoundManager();
    this.characterManager = new CharacterManager(this.physicsEngine, this.soundManager, this.gameMode);

    // Initialize managers
    this.inputManager = new InputManager();
    this.shakeManager = new ShakeManager();
    this.animationManager = new AnimationManager(this);
    this.gameStateManager = new GameStateManager(this.characterManager);
    this.popManager = new PopManager();

    // Set up manager connections
    this.setupManagerConnections();

    // Initialize game loop
    this.gameLoop = new GameLoop({
      update: this.update.bind(this),
      draw: this.draw.bind(this),
    });

    if (canvas) this.setCanvas(canvas);
  }

  private setupLoadingProgress(): void {
    // Update progress every 100ms to show real-time loading
    const progressInterval = setInterval(() => {
      const soundProgress = this.soundManager.getLoadingProgress();
      const imageProgress = this.characterManager.getImageManager().getLoadingProgress();

      // Weight sounds and images equally (50% each)
      this.loadingProgress = (soundProgress + imageProgress) / 2;

      if (this.loadingProgress >= 100) {
        this.isLoading = false;
        clearInterval(progressInterval);
      }
    }, 100);

    // Track image loading completion
    this.characterManager.getImageManager().setOnLoadComplete(() => {
      // Images are loaded
      this.characterManager.getBodyCache().preload();
    });
  }

  private setupManagerConnections(): void {
    // Connect shake manager to physics engine
    this.shakeManager.setOnShakeUpdate((angle, velocity) => {
      this.physicsEngine.applyShake(angle, velocity);
    });

    // Connect input manager drop callback
    this.inputManager.setOnDrop(this.handleDrop.bind(this));

    // Connect input manager pop callback
    this.inputManager.setOnPop(this.handlePopClick.bind(this));

    // Connect input manager pop mode check
    this.inputManager.setIsPopModeActive(() => this.popManager.isPopMode());

    // Connect animation manager to character manager for combo system
    this.characterManager.setAnimationManager(this.animationManager);

    // Connect pop manager to character removal
    this.popManager.setOnPopCharacter(this.handlePopCharacter.bind(this));
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

    // Set up loading progress tracking
    this.setupLoadingProgress();
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
      this.shakeManager.isShaking() ||
      this.popManager.isPopMode()
    )
      return;

    if (!this.animationManager.canDrop()) {
      // Queue the drop for later execution
      this.animationManager.queueDrop();
      return;
    }

    // Execute the drop
    await this.executeDrop();
  }

  private async executeDrop(): Promise<void> {
    // Use the current mouseX position from InputManager instead of recalculating
    const x = this.inputManager.getCurrentMouseX();
    if (x === null) return;

    // Drop at fixed Y position (just above the game over line)
    const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

    // Create and add the character at the restricted position
    const character = await this.characterManager.createCharacter(this.gameStateManager.getCurrentCharacter()!, x, dropY);
    this.characterManager.addCharacter(character);

    // Record the drop execution time
    this.animationManager.recordDropExecution();

    // Start cooldown timer
    this.animationManager.startDropCooldown();
    this.gameStateManager.setHasStarted(true);

    // Generate next character
    this.gameStateManager.generateNextCharacter();
    this.animationManager.resetCharacterAnimation();
    this.inputManager.setCurrentCharacter(this.gameStateManager.getCurrentCharacter());

    // Play water drop sound
    this.soundManager.playWaterPlop();
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
    this.popManager.update(deltaTime);

    // Check for queued drops and execute them if ready
    if (this.animationManager.isDropQueued() && this.animationManager.canDrop()) {
      this.animationManager.clearDropQueue();
      await this.executeDrop();
    }
  }

  private draw(): void {
    this.renderer?.clear();
    this.renderer?.drawBox();

    // Draw current character preview and drop indicator
    const currentCharacter = this.gameStateManager.getCurrentCharacter();
    if (currentCharacter && !this.gameStateManager.isGameOver() && !this.shakeManager.isShaking() && !this.popManager.isPopMode()) {
      const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

      // Show drop indicator when character is fully animated and ready
      // On mobile, also show when dragging
      if (this.animationManager.canDrop() && (this.inputManager.isMobile() ? this.inputManager.isDragging() : true)) {
        this.renderer?.drawDropIndicator(this.inputManager.getCurrentMouseX(), dropY);
      }

      // Draw animated character preview
      const animationProgress = this.animationManager.getCharacterAnimationProgress();
      this.renderer?.drawAnimatedMouseCursor(this.inputManager.getCurrentMouseX(), dropY, currentCharacter, animationProgress, 1);
    }

    // Draw characters
    for (const character of this.characterManager.getCharacters()) {
      this.renderer?.drawCharacter(character);

      // Draw debug polygons if debug mode is enabled
      if (this.debugMode) {
        this.renderer?.drawCharacterPolygon(character);
      }
    }

    // Draw particles
    for (const particle of this.characterManager.getParticles()) {
      this.renderer?.drawParticle(particle);
    }

    // Draw red X cursor in pop mode
    if (this.popManager.isPopMode()) {
      this.renderer?.drawRedXCursor(this.inputManager.getCurrentMouseX(), this.inputManager.getCurrentMouseY());
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

  public setSFXVolume(volume: number): void {
    this.soundManager.setSFXVolume(volume);
  }

  public getSFXVolume(): number {
    return this.soundManager.getSFXVolume();
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

  public get isDropQueued(): boolean {
    return this.animationManager.isDropQueued();
  }

  public get timeSinceLastDrop(): number {
    return this.animationManager.getTimeSinceLastDrop();
  }

  // Combo system methods
  public getComboMultiplier(): number {
    return this.animationManager.getComboMultiplier();
  }

  public isComboDisplayVisible(): boolean {
    return this.animationManager.isComboDisplayVisible();
  }

  setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
    this.characterManager.setGameMode(gameMode);

    // Save the selected gamemode to settings
    SettingsManager.updateSettings({ lastPlayedGameMode: gameMode });

    // Clear current characters and regenerate for the new game mode
    this.gameStateManager.clearCharacters();
    this.gameStateManager.generateNextCharacter();
  }

  getGameMode(): GameMode {
    return this.gameMode;
  }

  public toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
  }

  public isDebugMode(): boolean {
    return this.debugMode;
  }

  private handlePopClick(x: number, y: number): void {
    if (x === -1 && y === -1) {
      // Click outside canvas - cancel pop mode
      this.popManager.cancelPopMode();
      return;
    }

    if (this.popManager.isPopMode()) {
      this.popManager.attemptPop(x, y);
    }
  }

  private handlePopCharacter(x: number, y: number): boolean {
    const characters = this.characterManager.getCharacters();

    // Find character at the clicked position
    for (const character of characters) {
      const pos = this.physicsEngine.getBodyPosition(character.body);
      const distance = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);

      if (distance <= character.radius) {
        // Remove the character
        this.characterManager.removeCharacter(character.id);

        // Play pop sound
        this.soundManager.playPop(Sound.Pop, 1);

        return true; // Successfully popped a character
      }
    }

    return false; // No character found at this position
  }

  public startPopMode(): void {
    this.popManager.startPopMode();
  }

  public cancelPopMode(): void {
    this.popManager.cancelPopMode();
  }

  public getPopCooldown(): number {
    return this.popManager.getCooldown();
  }

  public isPopMode(): boolean {
    return this.popManager.isPopMode();
  }

  public canPop(): boolean {
    return this.popManager.canPop();
  }
}

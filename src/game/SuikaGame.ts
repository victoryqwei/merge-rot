import { CharacterClass, Character } from "../types/GameTypes";
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
import CrazyGames from "./CrazyGames";
import CubicBezier from "../utils/CubicBezier";

export class SuikaGame {
  public canvas: HTMLCanvasElement | null = null;
  private renderer?: Renderer;
  private physicsEngine: PhysicsEngine;
  private characterManager: CharacterManager;
  public soundManager: SoundManager;
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
  public popManager: PopManager;

  // Ads
  public cubicBezier: CubicBezier;

  constructor(canvas: HTMLCanvasElement | null, gameMode: GameMode = GameMode.ITALIAN_BRAINROT) {
    makeAutoObservable(this);

    // Load the last played gamemode from settings, fallback to provided gameMode
    const settings = SettingsManager.getSettings();
    this.gameMode = settings.lastPlayedGameMode || gameMode;

    // Initialize core systems
    this.physicsEngine = new PhysicsEngine(settings.gameBoxScale);
    this.soundManager = new SoundManager(this.gameMode);
    this.characterManager = new CharacterManager(this.physicsEngine, this.soundManager, this.gameMode);

    // Initialize managers
    this.inputManager = new InputManager();
    this.shakeManager = new ShakeManager();
    this.animationManager = new AnimationManager(this);
    this.gameStateManager = new GameStateManager(this.characterManager, this);
    this.popManager = new PopManager();

    // Initialize CubicBezier
    this.cubicBezier = new CubicBezier(this);

    // Set up manager connections
    this.setupManagerConnections();

    // Initialize game loop
    this.gameLoop = new GameLoop({
      update: this.update.bind(this),
      draw: this.draw.bind(this),
    });

    if (canvas) this.setCanvas(canvas);
  }

  static get isCrazyGames(): boolean {
    return (
      window.location.hostname.includes("crazygames") ||
      window.location.hostname.includes("127.0.0.1") ||
      window.location.hostname.includes("mergerot.app")
    );
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
        CrazyGames.loadingStop();
        clearInterval(progressInterval);
      }
    }, 100);

    // Track image loading completion
    this.characterManager.getImageManager().setOnLoadComplete(() => {
      // Images are loaded
      this.characterManager.getBodyCache().preload(this.gameMode);
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
    this.renderer = new Renderer(canvas, this.characterManager.getImageManager());
    this.renderer.setBoxScale(this.getGameBoxScale());
    this.inputManager.setCanvas(canvas);
    this.inputManager.setBoxScale(this.getGameBoxScale());
    this.init().catch(console.error);
  }

  private async init(): Promise<void> {
    // Don't auto-load saved games - let the user choose through the UI
    // Always start fresh during initialization
    this.gameStateManager.generateNextCharacter();

    // Update InputManager with current character
    this.inputManager.setCurrentCharacter(this.gameStateManager.getCurrentCharacter());

    this.setupWindowEvents();
    this.gameLoop.start();

    // Start background music
    this.soundManager.setOnLoadComplete(() => {
      this.soundManager.playBackgroundMusic();
    });

    // Set up loading progress tracking
    this.setupLoadingProgress();

    // Set up CrazyGames SDK
    await CrazyGames.init();
    CrazyGames.loadingStart();
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
    const scale = this.getGameBoxScale();

    // Update canvas size to accommodate scaled box
    if (this.canvas) {
      const scaledWidth = GAME_CONFIG.PADDING * 2 + GAME_CONFIG.BOX_WIDTH * scale;
      const scaledHeight = GAME_CONFIG.CANVAS_HEIGHT * scale;
      
      this.canvas.width = scaledWidth * pixelRatio;
      this.canvas.height = scaledHeight * pixelRatio;

      // Set CSS size with scale applied
      this.canvas.style.width = scaledWidth + "px";
      this.canvas.style.height = scaledHeight + "px";
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

    // Find hovered character when in pop mode
    let hoveredCharacter: Character | null = null;
    if (this.popManager.isPopMode()) {
      hoveredCharacter = this.findCharacterUnderMouse();
    }

    // Draw characters
    for (const character of this.characterManager.getCharacters()) {
      const isHighlighted = this.popManager.isPopMode() && character === hoveredCharacter;
      this.renderer?.drawCharacter(character, isHighlighted);

      // Draw debug polygons if debug mode is enabled
      if (this.debugMode) {
        this.renderer?.drawCharacterPolygon(character);
      }
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

  private findCharacterUnderMouse(): Character | null {
    const mouseX = this.inputManager.getCurrentMouseX();
    const mouseY = this.inputManager.getCurrentMouseY();
    const characters = this.characterManager.getCharacters();

    // Find all characters under the mouse position
    const hoveredCharacters: Character[] = [];

    for (const character of characters) {
      const pos = this.physicsEngine.getBodyPosition(character.body);
      const distance = Math.sqrt((pos.x - mouseX) ** 2 + (pos.y - mouseY) ** 2);

      if (distance <= character.radius) {
        hoveredCharacters.push(character);
      }
    }

    // If no characters are hovered, return null
    if (hoveredCharacters.length === 0) {
      return null;
    }

    // Sort by radius (ascending) to prioritize smaller characters
    hoveredCharacters.sort((a, b) => a.radius - b.radius);

    // Return the smallest character
    return hoveredCharacters[0];
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

  public setGameBoxScale(scale: number): void {
    SettingsManager.updateSettings({ gameBoxScale: scale });
    this.physicsEngine.rebuildBoundaries(scale);
    if (this.renderer) {
      this.renderer.setBoxScale(scale);
    }
    this.inputManager.setBoxScale(scale);
    this.handleResize();
  }

  public getGameBoxScale(): number {
    const settings = SettingsManager.getSettings();
    return settings.gameBoxScale;
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

  async setGameMode(gameMode: GameMode): Promise<void> {
    this.gameMode = gameMode;
    await this.characterManager.setGameMode(gameMode);
    await this.soundManager.switchGameMode(gameMode);
    this.gameStateManager.setGameMode(gameMode);

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
        // Create explosion effect at character position
        this.characterManager.createExplosion(pos.x, pos.y);

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

  public hasSavedGame(): boolean {
    return this.gameStateManager.hasSavedGame();
  }

  public clearSavedGame(): void {
    this.gameStateManager.clearSavedGame();
  }

  public async loadSavedGame(): Promise<boolean> {
    const loaded = await this.gameStateManager.loadGameState();
    if (loaded) {
      // Synchronize InputManager with loaded current character
      this.inputManager.setCurrentCharacter(this.gameStateManager.getCurrentCharacter());

      // Reset animation state for the loaded game
      this.animationManager.reset();

      console.info("Saved game loaded and synchronized");
    }
    return loaded;
  }

  public getCurrentCharacter(): CharacterClass | null {
    return this.gameStateManager.getCurrentCharacter();
  }

  public destroy(): void {
    this.gameStateManager.destroy();
    this.gameLoop.stop();
  }
}

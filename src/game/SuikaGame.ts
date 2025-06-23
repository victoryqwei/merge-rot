import type { CharacterType } from "../types/GameTypes";
import { CharacterManager } from "./CharacterManager";
import { Renderer } from "../utils/Renderer";
import { PhysicsEngine } from "../utils/PhysicsEngine";
import { SoundManager } from "../utils/SoundManager";
import { GAME_CONFIG } from "../constants/GameConstants";

export class SuikaGame {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private physicsEngine: PhysicsEngine;
  private characterManager: CharacterManager;
  private soundManager: SoundManager;
  private score: number = 0;
  private currentCharacter: CharacterType | null = null;
  private mouseX: number = 0;
  private gameOver: boolean = false;
  private dropCooldown: number = 0;
  private onScoreUpdate?: (score: number) => void;
  private onNextCharacterUpdate?: (character: CharacterType) => void;
  private onGameOver?: (finalScore: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.physicsEngine = new PhysicsEngine();
    this.soundManager = new SoundManager();
    this.characterManager = new CharacterManager(this.physicsEngine, this.soundManager);
    this.init();
  }

  private init(): void {
    this.generateNextCharacter();
    this.setupEventListeners();
    this.gameLoop();
    // Start background music
    this.soundManager.playBackgroundMusic();
  }

  private setupEventListeners(): void {
    // Track mouse movement
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
    });

    // Add character on click
    this.canvas.addEventListener("click", (e) => {
      if (this.gameOver || !this.currentCharacter || this.dropCooldown > 0) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // Drop at fixed Y position (just above the game over line)
      const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

      // Create and add the character at the restricted position
      const character = this.characterManager.createCharacter(this.currentCharacter, x, dropY);
      this.characterManager.addCharacter(character);

      // Start cooldown timer (convert ms to frames at 60fps)
      this.dropCooldown = Math.ceil(GAME_CONFIG.DROP_COOLDOWN_TIME / 16.67); // 1000ms / 60fps ≈ 16.67ms per frame

      // Generate next character
      this.generateNextCharacter();
    });

    // Handle window resize for high DPI displays
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  private handleResize(): void {
    // Re-setup the canvas for high DPI if needed
    const pixelRatio = this.renderer.getPixelRatio();

    // Update canvas size
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH * pixelRatio;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT * pixelRatio;

    // Set CSS size back to original dimensions
    this.canvas.style.width = GAME_CONFIG.CANVAS_WIDTH + "px";
    this.canvas.style.height = GAME_CONFIG.CANVAS_HEIGHT + "px";
  }

  private generateNextCharacter(): void {
    this.currentCharacter = this.characterManager.generateRandomCharacter();
    this.onNextCharacterUpdate?.(this.currentCharacter);
  }

  private update(): void {
    if (this.gameOver) return;

    // Update cooldown timer
    if (this.dropCooldown > 0) {
      this.dropCooldown--;
    }

    // Update physics
    this.characterManager.updateCharacters();

    // Check for character combinations
    const scoreIncrease = this.characterManager.checkCombinations();
    if (scoreIncrease > 0) {
      this.score += scoreIncrease;
      this.onScoreUpdate?.(this.score);
    }

    // Update particles
    this.characterManager.updateParticles();

    // Check for game over
    if (this.characterManager.checkGameOver()) {
      this.endGame();
    }
  }

  private draw(): void {
    this.renderer.clear();
    this.renderer.drawGrid();
    this.renderer.drawGameOverLine();

    // Draw characters
    for (const character of this.characterManager.getCharacters()) {
      this.renderer.drawCharacter(character);
    }

    // Draw current character preview and drop indicator (only if in valid drop area)
    if (this.currentCharacter && !this.gameOver) {
      const dropY = GAME_CONFIG.GAME_OVER_HEIGHT - 50;

      const alpha = this.dropCooldown > 0 ? 0 : 1; // Dim when on cooldown
      this.renderer.drawMouseCursor(this.mouseX, dropY, this.currentCharacter, alpha);
      this.renderer.drawDropIndicator(this.mouseX, dropY);
    }

    // Draw particles
    for (const particle of this.characterManager.getParticles()) {
      this.renderer.drawParticle(particle);
    }
  }

  private gameLoop(): void {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  private endGame(): void {
    this.gameOver = true;
    this.onGameOver?.(this.score);
  }

  // Public methods for external control
  public setScoreCallback(callback: (score: number) => void): void {
    this.onScoreUpdate = callback;
  }

  public setNextCharacterCallback(callback: (character: CharacterType) => void): void {
    this.onNextCharacterUpdate = callback;
  }

  public setGameOverCallback(callback: (finalScore: number) => void): void {
    this.onGameOver = callback;
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
    this.dropCooldown = 0;
    this.characterManager.clear();
    this.generateNextCharacter();
    this.onScoreUpdate?.(this.score);
  }
}

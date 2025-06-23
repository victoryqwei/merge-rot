import type { FruitType } from "../types/GameTypes";
import { FruitManager } from "./FruitManager";
import { Renderer } from "../utils/Renderer";
import { PhysicsEngine } from "../utils/PhysicsEngine";

export class SuikaGame {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private physicsEngine: PhysicsEngine;
  private fruitManager: FruitManager;
  private score: number = 0;
  private currentFruit: FruitType | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private gameOver: boolean = false;
  private dropCooldown: number = 0;
  private dropCooldownTime: number = 36; // 600ms at 60fps
  private onScoreUpdate?: (score: number) => void;
  private onNextFruitUpdate?: (fruit: FruitType) => void;
  private onGameOver?: (finalScore: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.physicsEngine = new PhysicsEngine();
    this.fruitManager = new FruitManager(this.physicsEngine);
    this.init();
  }

  private init(): void {
    this.generateNextFruit();
    this.setupEventListeners();
    this.gameLoop();
  }

  private setupEventListeners(): void {
    // Track mouse movement
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    // Add fruit on click
    this.canvas.addEventListener("click", (e) => {
      if (this.gameOver || !this.currentFruit || this.dropCooldown > 0) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create and add the fruit at mouse position
      const fruit = this.fruitManager.createFruit(this.currentFruit, x, y);
      this.fruitManager.addFruit(fruit);

      // Start cooldown timer
      this.dropCooldown = this.dropCooldownTime;

      // Generate next fruit
      this.generateNextFruit();
    });
  }

  private generateNextFruit(): void {
    this.currentFruit = this.fruitManager.generateRandomFruit();
    this.onNextFruitUpdate?.(this.currentFruit);
  }

  private update(): void {
    if (this.gameOver) return;

    // Update cooldown timer
    if (this.dropCooldown > 0) {
      this.dropCooldown--;
    }

    // Update physics
    this.fruitManager.updateFruits();

    // Check for fruit combinations
    const scoreIncrease = this.fruitManager.checkCombinations();
    if (scoreIncrease > 0) {
      this.score += scoreIncrease;
      this.onScoreUpdate?.(this.score);
    }

    // Update particles
    this.fruitManager.updateParticles();

    // Check for game over
    if (this.fruitManager.checkGameOver()) {
      this.endGame();
    }
  }

  private draw(): void {
    this.renderer.clear();
    this.renderer.drawGrid();
    this.renderer.drawGameOverLine();

    // Draw fruits
    for (const fruit of this.fruitManager.getFruits()) {
      this.renderer.drawFruit(fruit);
    }

    // Draw current fruit preview at mouse position (with cooldown indication)
    if (this.currentFruit && !this.gameOver) {
      const alpha = this.dropCooldown > 0 ? 0.3 : 0.6; // Dim when on cooldown
      this.renderer.drawMouseCursor(this.mouseX, this.mouseY, this.currentFruit, alpha);
    }

    // Draw particles
    for (const particle of this.fruitManager.getParticles()) {
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

  public setNextFruitCallback(callback: (fruit: FruitType) => void): void {
    this.onNextFruitUpdate = callback;
  }

  public setGameOverCallback(callback: (finalScore: number) => void): void {
    this.onGameOver = callback;
  }

  public getScore(): number {
    return this.score;
  }

  public restart(): void {
    this.score = 0;
    this.currentFruit = null;
    this.gameOver = false;
    this.dropCooldown = 0;
    this.fruitManager.clear();
    this.generateNextFruit();
    this.onScoreUpdate?.(this.score);
  }
}

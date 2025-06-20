import type { Fruit, FruitType } from "../types/GameTypes";
import { FruitManager } from "./FruitManager";
import { Renderer } from "../utils/Renderer";

export class SuikaGame {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private fruitManager: FruitManager;
  private score: number = 0;
  private currentFruit: Fruit | null = null;
  private nextFruit: FruitType | null = null;
  private gameOver: boolean = false;
  private onScoreUpdate?: (score: number) => void;
  private onNextFruitUpdate?: (fruit: FruitType) => void;
  private onGameOver?: (finalScore: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.fruitManager = new FruitManager();
    this.init();
  }

  private init(): void {
    this.generateNextFruit();
    this.canvas.addEventListener("click", (e) => this.handleClick(e));
    this.gameLoop();
  }

  private generateNextFruit(): void {
    this.nextFruit = this.fruitManager.generateRandomFruit();
    if (!this.currentFruit) {
      this.currentFruit = this.fruitManager.createFruit(this.nextFruit, this.canvas.width / 2, 50);
    }
    this.onNextFruitUpdate?.(this.nextFruit);
  }

  private handleClick(e: MouseEvent): void {
    if (this.gameOver) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (this.currentFruit) {
      this.currentFruit.x = x;
      this.fruitManager.addFruit({ ...this.currentFruit });
      this.currentFruit = null;
      this.generateNextFruit();
    }
  }

  private update(): void {
    if (this.gameOver) return;

    // Update current fruit position
    if (this.currentFruit) {
      this.currentFruit.y += 2;
      if (this.currentFruit.y > this.canvas.height - this.currentFruit.radius) {
        this.currentFruit.y = this.canvas.height - this.currentFruit.radius;
        this.fruitManager.addFruit({ ...this.currentFruit });
        this.currentFruit = null;
        this.generateNextFruit();
      }
    }

    // Update all fruits physics
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

    // Draw current fruit
    if (this.currentFruit) {
      this.renderer.drawFruit(this.currentFruit);
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
    this.nextFruit = null;
    this.gameOver = false;
    this.fruitManager.clear();
    this.generateNextFruit();
    this.onScoreUpdate?.(this.score);
  }
}

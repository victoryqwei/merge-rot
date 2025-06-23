import type { Fruit, FruitType, Particle } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = context;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }

  drawGrid(): void {
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }

  drawFruit(fruit: Fruit): void {
    const x = fruit.body.position.x;
    const y = fruit.body.position.y;

    // Draw shadow
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.beginPath();
    this.ctx.arc(x + 2, y + 2, fruit.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw fruit body
    this.ctx.fillStyle = fruit.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, fruit.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw fruit border
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw emoji
    this.ctx.font = `${fruit.radius}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(fruit.emoji, x, y);
  }

  drawParticle(particle: Particle): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / GAME_CONFIG.PARTICLE_LIFE})`;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGameOverLine(): void {
    this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, GAME_CONFIG.GAME_OVER_HEIGHT);
    this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GAME_OVER_HEIGHT);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawMouseCursor(x: number, y: number, fruitType: FruitType, alpha: number = 0.6): void {
    // Draw a preview of the fruit at mouse position
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = fruitType.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, fruitType.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = `${fruitType.radius}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(fruitType.emoji, x, y);
    this.ctx.globalAlpha = 1.0;
  }
}

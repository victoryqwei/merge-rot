import type { Character, CharacterType, Particle } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = context;
    this.pixelRatio = window.devicePixelRatio || 1;

    this.setupHighDPICanvas(canvas);
  }

  private setupHighDPICanvas(canvas: HTMLCanvasElement): void {
    // Set the canvas size in memory (scaled up for high DPI)
    canvas.width = GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio;

    // Set the CSS size to the original game dimensions
    canvas.style.width = GAME_CONFIG.CANVAS_WIDTH + "px";
    canvas.style.height = GAME_CONFIG.CANVAS_HEIGHT + "px";
  }

  clear(): void {
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio, GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio);
  }

  drawGrid(): void {
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio; x += GAME_CONFIG.GRID_SIZE * this.pixelRatio) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio; y += GAME_CONFIG.GRID_SIZE * this.pixelRatio) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio, y);
      this.ctx.stroke();
    }
  }

  drawCharacter(character: Character): void {
    const x = character.body.position.x * this.pixelRatio;
    const y = character.body.position.y * this.pixelRatio;
    const radius = character.radius * this.pixelRatio;

    // Draw shadow
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.beginPath();
    this.ctx.arc(x + 2 * this.pixelRatio, y + 2 * this.pixelRatio, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw character body
    this.ctx.fillStyle = character.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw character border
    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.stroke();

    // Draw emoji
    this.ctx.font = `${radius}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(character.emoji, x, y);
  }

  drawParticle(particle: Particle): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / GAME_CONFIG.PARTICLE_LIFE})`;
    this.ctx.beginPath();
    this.ctx.arc(particle.x * this.pixelRatio, particle.y * this.pixelRatio, 2 * this.pixelRatio, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGameOverLine(): void {
    this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    this.ctx.lineWidth = 3 * this.pixelRatio;
    this.ctx.setLineDash([5 * this.pixelRatio, 5 * this.pixelRatio]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio);
    this.ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio, GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawMouseCursor(x: number, y: number, characterType: CharacterType, alpha: number = 0.6): void {
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const scaledRadius = characterType.radius * this.pixelRatio;

    // Draw a preview of the character at mouse position
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = characterType.color;
    this.ctx.beginPath();
    this.ctx.arc(scaledX, scaledY, scaledRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#333";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.stroke();

    this.ctx.font = `${scaledRadius}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(characterType.emoji, scaledX, scaledY);
    this.ctx.globalAlpha = 1.0;
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }
}

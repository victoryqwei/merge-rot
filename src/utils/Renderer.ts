import type { Character, Particle } from "../types/GameTypes";
import { CharacterClass } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";
import { ImageManager } from "./ImageManager";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private pixelRatio: number;
  private imageManager: ImageManager;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = context;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.imageManager = new ImageManager();

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

    // Draw character image with rotation (no circular clipping)
    const image = this.imageManager.getImage(character.name);
    if (image) {
      this.ctx.save();

      // Move to character center
      this.ctx.translate(x, y);

      // Apply rotation
      this.ctx.rotate(character.rotation);

      // Draw the rotated image without circular clipping
      const imageSize = radius * 2;
      this.ctx.drawImage(image, -radius, -radius, imageSize, imageSize);

      this.ctx.restore();
    }
    // No fallback circle - only draw if image is available
  }

  drawParticle(particle: Particle): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / GAME_CONFIG.PARTICLE_LIFE})`;
    this.ctx.beginPath();
    this.ctx.arc(particle.x * this.pixelRatio, particle.y * this.pixelRatio, 2 * this.pixelRatio, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGameOverBox(): void {
    const boxY = GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio;
    const boxHeight = (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GAME_OVER_HEIGHT) * this.pixelRatio;
    const boxWidth = GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio;
    const thickness = 50 * this.pixelRatio; // Thickness of the box walls

    // Draw outer box (back face)
    this.ctx.fillStyle = "rgba(139, 69, 19, 0.4)"; // Brown with transparency
    this.ctx.fillRect(0, boxY, boxWidth, boxHeight);

    // Draw outer box border
    this.ctx.strokeStyle = "rgba(139, 69, 19, 0.9)"; // Darker brown for border
    this.ctx.lineWidth = 2 * this.pixelRatio;

    this.ctx.strokeRect(0, boxY, boxWidth, boxHeight);

    // Draw inner box (front face) - creates the cutout effect
    this.ctx.fillStyle = "rgba(160, 82, 45, 0.3)"; // Lighter brown for inner face
    this.ctx.fillRect(thickness, boxY - thickness, boxWidth - thickness * 2, boxHeight);

    // Draw inner box border
    this.ctx.strokeStyle = "rgba(160, 82, 45, 0.8)"; // Lighter brown for inner border
    this.ctx.lineWidth = 1 * this.pixelRatio;
    this.ctx.strokeRect(thickness, boxY - thickness, boxWidth - thickness * 2, boxHeight);

    // Draw connecting lines to create the 3D effect
    this.ctx.strokeStyle = "rgba(139, 69, 19, 0.7)";
    this.ctx.lineWidth = 1 * this.pixelRatio;

    // Top-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY);
    this.ctx.lineTo(thickness, boxY - thickness);
    this.ctx.stroke();

    // Top-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth, boxY);
    this.ctx.lineTo(boxWidth - thickness, boxY - thickness);
    this.ctx.stroke();

    // Bottom-left corner
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY + boxHeight);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

    // Bottom-right corner
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth, boxY + boxHeight);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();
  }

  drawMouseCursor(x: number, y: number, characterType: CharacterClass, alpha: number = 0.6): void {
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const scaledRadius = characterType.radius * this.pixelRatio;

    // Draw a preview of the character at mouse position
    this.ctx.globalAlpha = alpha;

    const image = this.imageManager.getImage(characterType.name);
    if (image) {
      this.ctx.save();

      // Move to character center
      this.ctx.translate(scaledX, scaledY);

      // Draw the image without circular clipping
      const imageSize = scaledRadius * 2;
      this.ctx.drawImage(image, -scaledRadius, -scaledRadius, imageSize, imageSize);

      this.ctx.restore();
    }
    // No fallback circle - only draw if image is available

    this.ctx.globalAlpha = 1.0;
  }

  drawAnimatedMouseCursor(x: number, y: number, characterType: CharacterClass, animationProgress: number, alpha: number = 0.6): void {
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const animatedRadius = characterType.radius * animationProgress * this.pixelRatio;

    // Don't draw if animation progress is 0
    if (animationProgress <= 0) return;

    // Draw a preview of the character at mouse position with animation
    this.ctx.globalAlpha = alpha * animationProgress; // Fade in with animation

    const image = this.imageManager.getImage(characterType.name);
    if (image) {
      this.ctx.save();

      // Move to character center
      this.ctx.translate(scaledX, scaledY);

      // Draw the image without circular clipping
      const imageSize = animatedRadius * 2;
      this.ctx.drawImage(image, -animatedRadius, -animatedRadius, imageSize, imageSize);

      this.ctx.restore();
    }
    // No fallback circle - only draw if image is available

    this.ctx.globalAlpha = 1.0;
  }

  drawDropIndicator(x: number, dropY: number): void {
    // Draw vertical line from mouse position to drop position
    this.ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.setLineDash([3 * this.pixelRatio, 3 * this.pixelRatio]);

    this.ctx.beginPath();
    this.ctx.moveTo(x * this.pixelRatio, dropY * this.pixelRatio);
    this.ctx.lineTo(x * this.pixelRatio, GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  isImagesLoaded(): boolean {
    return this.imageManager.isLoaded();
  }
}

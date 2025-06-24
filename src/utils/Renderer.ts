import type { Character, Particle } from "../types/GameTypes";
import { CharacterClass } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";
import { ImageManager } from "./ImageManager";

const THICKNESS = 50;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private pixelRatio: number;
  private imageManager: ImageManager;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context from canvas");
    this.ctx = context;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.imageManager = new ImageManager();
    this.setupHighDPICanvas(canvas);
  }

  private setupHighDPICanvas(canvas: HTMLCanvasElement): void {
    canvas.width = GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio;
    canvas.style.width = GAME_CONFIG.CANVAS_WIDTH + "px";
    canvas.style.height = GAME_CONFIG.CANVAS_HEIGHT + "px";
  }

  clear(): void {
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio, GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio);
  }

  private getAspectFitSize(imgWidth: number, imgHeight: number, maxSize: number) {
    const aspect = imgWidth / imgHeight;
    let drawWidth = maxSize;
    let drawHeight = maxSize;
    if (aspect > 1) {
      drawHeight = maxSize / aspect;
    } else {
      drawWidth = maxSize * aspect;
    }
    return { drawWidth, drawHeight };
  }

  drawCharacter(character: Character): void {
    const x = character.body.position.x * this.pixelRatio;
    const y = character.body.position.y * this.pixelRatio;
    const radius = character.radius * this.pixelRatio;
    const image = this.imageManager.getImage(character.name);
    if (image) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(character.rotation);
      const maxSize = radius * 2;
      const { drawWidth, drawHeight } = this.getAspectFitSize(image.width, image.height, maxSize);
      this.ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      this.ctx.restore();
    }
  }

  drawParticle(particle: Particle): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life / GAME_CONFIG.PARTICLE_LIFE})`;
    this.ctx.beginPath();
    this.ctx.arc(particle.x * this.pixelRatio, particle.y * this.pixelRatio, 2 * this.pixelRatio, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawOuterEdges(padding = 0, color = "rgba(139, 69, 19, 1)") {
    const boxY = GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio;
    const boxHeight = (GAME_CONFIG.BOX_HEIGHT - GAME_CONFIG.GAME_OVER_HEIGHT) * this.pixelRatio;
    const boxWidth = GAME_CONFIG.BOX_WIDTH * this.pixelRatio;
    const thickness = THICKNESS * this.pixelRatio;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.beginPath();
    const radius = 5 * this.pixelRatio;
    this.ctx.moveTo(padding, boxY + radius + padding);
    this.ctx.lineTo(padding, boxY + boxHeight - radius - padding); // Left edge
    this.ctx.arcTo(padding, boxY + boxHeight - padding, padding + radius, boxY + boxHeight - padding, radius); // Bottom left corner
    this.ctx.lineTo(boxWidth - radius - padding, boxY + boxHeight - padding); // Bottom edge
    this.ctx.arcTo(boxWidth - padding, boxY + boxHeight - padding, boxWidth - padding, boxY + boxHeight - radius - padding, radius); // Bottom right corner
    this.ctx.lineTo(boxWidth - padding, boxY + radius + padding); // Right edge

    this.ctx.arcTo(boxWidth - padding, boxY + padding, boxWidth - padding, boxY - thickness + padding, radius);
    this.ctx.lineTo(boxWidth - thickness - padding, boxY - thickness + padding);

    this.ctx.arcTo(thickness + padding, boxY - thickness + padding, thickness + padding, boxY - thickness + padding, radius);
    this.ctx.lineTo(thickness + padding, boxY - thickness + padding);

    this.ctx.arcTo(padding, boxY + padding, padding, boxY + radius + padding, radius);
    this.ctx.closePath();

    this.ctx.stroke();
  }

  drawBox(): void {
    const boxY = GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio;
    const boxHeight = (GAME_CONFIG.BOX_HEIGHT - GAME_CONFIG.GAME_OVER_HEIGHT) * this.pixelRatio;
    const boxWidth = GAME_CONFIG.BOX_WIDTH * this.pixelRatio;
    const thickness = 50 * this.pixelRatio;

    this.ctx.save();
    this.ctx.translate(GAME_CONFIG.PADDING * this.pixelRatio, 0);

    // draw outer edges
    const padding = 2 * this.pixelRatio;
    this.drawOuterEdges(padding, "rgb(223, 170, 132)");
    this.drawOuterEdges(0, "rgba(139, 69, 19, 1)");

    // draw top edge
    this.ctx.beginPath();
    this.ctx.moveTo(padding * 2, boxY + padding * 2);
    this.ctx.lineTo(boxWidth - padding * 2, boxY + padding * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = "rgba(139, 69, 19, 0.4)";
    this.ctx.lineWidth = 2 * this.pixelRatio;

    // Bottom inner edge
    this.ctx.beginPath();
    this.ctx.moveTo(thickness + padding, boxY + boxHeight - thickness + padding);
    this.ctx.lineTo(boxWidth - thickness - padding, boxY + boxHeight - thickness + padding);
    this.ctx.stroke();

    // Bottom left edge
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY + boxHeight);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

    // Bottom right edge
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth, boxY + boxHeight);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

    // Inner left edge
    this.ctx.beginPath();
    this.ctx.moveTo(thickness, boxY - thickness);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

    // Inner right edge
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth - thickness, boxY - thickness);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

    // Draw left face
    this.ctx.beginPath();
    this.ctx.moveTo(thickness, boxY - thickness);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(0, boxY + boxHeight);
    this.ctx.lineTo(0, boxY);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(139, 69, 19, 0.4)";
    this.ctx.fill();

    // Draw right face
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth - thickness, boxY - thickness);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(boxWidth, boxY + boxHeight);
    this.ctx.lineTo(boxWidth, boxY);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(139, 69, 19, 0.4)";
    this.ctx.fill();

    // Draw back face
    this.ctx.beginPath();
    this.ctx.moveTo(thickness, boxY - thickness);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(boxWidth - thickness, boxY - thickness);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(179, 126, 88, 0.4)";
    this.ctx.fill();

    // Draw bottom face
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY + boxHeight);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.lineTo(boxWidth, boxY + boxHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = "rgba(179, 126, 88, 0.4)";
    this.ctx.fill();

    this.ctx.restore();
  }

  drawMouseCursor(x: number, y: number, characterType: CharacterClass, alpha: number = 0.6): void {
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const scaledRadius = characterType.radius * this.pixelRatio;
    this.ctx.globalAlpha = alpha;
    const image = this.imageManager.getImage(characterType.name);
    if (image) {
      this.ctx.save();
      this.ctx.translate(scaledX, scaledY);
      const maxSize = scaledRadius * 2;
      const { drawWidth, drawHeight } = this.getAspectFitSize(image.width, image.height, maxSize);
      this.ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawAnimatedMouseCursor(x: number, y: number, characterType: CharacterClass, animationProgress: number, alpha: number = 0.6): void {
    const scaledX = x * this.pixelRatio;
    const scaledY = y * this.pixelRatio;
    const animatedRadius = characterType.radius * animationProgress * this.pixelRatio;
    if (animationProgress <= 0) return;
    this.ctx.globalAlpha = alpha * animationProgress;
    const image = this.imageManager.getImage(characterType.name);
    if (image) {
      this.ctx.save();
      this.ctx.translate(scaledX, scaledY);
      const maxSize = animatedRadius * 2;
      const { drawWidth, drawHeight } = this.getAspectFitSize(image.width, image.height, maxSize);
      this.ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1.0;
  }

  drawDropIndicator(x: number, dropY: number): void {
    const thickness = THICKNESS * this.pixelRatio;
    const startY = dropY * this.pixelRatio;
    const endY = GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio - thickness;
    const gradient = this.ctx.createLinearGradient(0, startY, 0, endY);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.beginPath();
    this.ctx.moveTo(x * this.pixelRatio, startY);
    this.ctx.lineTo(x * this.pixelRatio, endY);
    this.ctx.stroke();
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  isImagesLoaded(): boolean {
    return this.imageManager.isLoaded();
  }

  applyShakeRotation(angle: number): void {
    if (angle !== 0) {
      this.ctx.save();
      const centerX = (GAME_CONFIG.CANVAS_WIDTH * this.pixelRatio) / 2;
      const centerY = (GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio) / 2;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(angle);
      this.ctx.translate(-centerX, -centerY);
    }
  }

  restoreShakeRotation(): void {
    this.ctx.restore();
  }
}

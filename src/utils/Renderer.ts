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

  drawBox(): void {
    const boxY = GAME_CONFIG.GAME_OVER_HEIGHT * this.pixelRatio;
    const boxHeight = (GAME_CONFIG.BOX_HEIGHT - GAME_CONFIG.GAME_OVER_HEIGHT) * this.pixelRatio;
    const boxWidth = GAME_CONFIG.BOX_WIDTH * this.pixelRatio;
    const thickness = 50 * this.pixelRatio;

    this.ctx.save();
    this.ctx.translate(GAME_CONFIG.PADDING * this.pixelRatio, 0);

    this.ctx.strokeStyle = "rgba(210, 180, 140, 0.8)";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.strokeRect(thickness, boxY - thickness, boxWidth - thickness * 2, boxHeight);

    this.ctx.fillStyle = "rgba(139, 69, 19, 0.4)";
    this.ctx.fillRect(0, boxY, boxWidth, boxHeight);

    this.ctx.fillStyle = "rgba(210, 180, 140, 0.3)";
    this.ctx.fillRect(thickness, boxY - thickness, boxWidth - thickness * 2, boxHeight);

    this.ctx.strokeStyle = "rgba(139, 69, 19, 0.9)";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.strokeRect(0, boxY, boxWidth, boxHeight);

    this.ctx.strokeStyle = "rgba(139, 69, 19, 0.7)";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY);
    this.ctx.lineTo(thickness, boxY - thickness);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth, boxY);
    this.ctx.lineTo(boxWidth - thickness, boxY - thickness);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(0, boxY + boxHeight);
    this.ctx.lineTo(thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(boxWidth, boxY + boxHeight);
    this.ctx.lineTo(boxWidth - thickness, boxY + boxHeight - thickness);
    this.ctx.stroke();

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
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    this.ctx.lineWidth = 2 * this.pixelRatio;
    this.ctx.beginPath();
    this.ctx.moveTo(x * this.pixelRatio, dropY * this.pixelRatio);
    this.ctx.lineTo(x * this.pixelRatio, GAME_CONFIG.CANVAS_HEIGHT * this.pixelRatio);
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

import { CHARACTER_TYPES } from "../constants/GameConstants";

export class ImageManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;

  constructor() {
    this.loadImages();
  }

  private loadImages(): void {
    const imageNames = CHARACTER_TYPES.map((character) => character.name);

    this.totalCount = imageNames.length;

    imageNames.forEach((name) => {
      const img = new Image();
      img.onload = () => {
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      };
      img.src = `/src/assets/${name}.png`;
      this.images.set(name, img);
    });
  }

  getImage(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }

  setOnLoadComplete(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  isLoaded(): boolean {
    return this.loadedCount === this.totalCount;
  }
}

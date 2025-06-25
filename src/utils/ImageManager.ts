import { CHARACTER_TYPES } from "../constants/GameConstants";

export class ImageManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;

  constructor() {
    this.loadImages();
  }

  private async loadImages(): Promise<void> {
    const imageNames = CHARACTER_TYPES.map((character) => character.name);

    this.totalCount = imageNames.length;

    for (const name of imageNames) {
      try {
        const img = new Image();
        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount === this.totalCount) {
            this.onLoadComplete?.();
          }
        };

        // Use dynamic import to get the correct URL for the build
        const imageModule = await import(`../assets/characters/${name}.png`);
        img.src = imageModule.default;
        this.images.set(name, img);
      } catch (error) {
        console.error(`Failed to load image for ${name}:`, error);
        // Still count as loaded to prevent infinite waiting
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      }
    }
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

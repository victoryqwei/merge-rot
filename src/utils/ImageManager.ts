import { CharacterClass } from "../types/GameTypes";

export class ImageManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;

  constructor() {
    this.loadImages();
  }

  private async loadImages(): Promise<void> {
    const imageData = CharacterClass.getAllCharactersAllModes().map((character) => ({
      name: character.name,
      mode: character.mode,
    }));

    this.totalCount = imageData.length;

    for (const data of imageData) {
      try {
        const img = new Image();
        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount === this.totalCount) {
            this.onLoadComplete?.();
          }
        };

        // Use dynamic import to get the correct URL for the build
        const imageModule = await import(`../assets/characters/${data.mode}/${data.name}.webp`);
        img.src = imageModule.default;
        this.images.set(data.name, img);
      } catch (error) {
        console.error(`Failed to load image for ${data.name}:`, error);
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

  // Get loading progress as percentage (0-100)
  getLoadingProgress(): number {
    if (this.totalCount === 0) return 0;
    return (this.loadedCount / this.totalCount) * 100;
  }
}

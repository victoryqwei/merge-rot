import { CharacterClass } from "../types/GameTypes";
import { GameMode } from "../constants/GameConstants";

export class ImageManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;

  constructor() {}

  // Initialize and load images for a specific game mode
  async init(gameMode: GameMode): Promise<void> {
    await this.loadImages(gameMode);
  }

  private async loadImages(gameMode: GameMode): Promise<void> {
    // Only load images for the specific gamemode
    const imageData = CharacterClass.getAllCharacters(gameMode).map((character) => ({
      name: character.name,
      mode: character.mode,
    }));

    // Filter out already loaded images
    const imagesToLoad = imageData.filter((data) => !this.images.has(data.name));
    this.totalCount = imagesToLoad.length;

    // If all images are already loaded, trigger completion immediately
    if (this.totalCount === 0) {
      this.loadedCount = 0;
      this.onLoadComplete?.();
      return;
    }

    for (const data of imagesToLoad) {
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

    console.info("Loaded images for game mode:", gameMode);
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
    if (this.totalCount === 0) return 100; // All images already cached
    return (this.loadedCount / this.totalCount) * 100;
  }

  // Method to switch to a new gamemode (loads new images but keeps existing ones cached)
  async switchGameMode(newGameMode: GameMode): Promise<void> {
    // Reset counters for the new loading operation
    this.loadedCount = 0;
    this.totalCount = 0;
    // Load any new images needed for this gamemode (existing ones stay cached)
    await this.loadImages(newGameMode);
  }
}

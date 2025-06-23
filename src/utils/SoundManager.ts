import { CHARACTER_TYPES } from "../constants/GameConstants";

export class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;

  constructor() {
    this.loadSounds();
  }

  private getSoundFileName(characterName: string): string {
    return characterName;
  }

  private loadSounds(): void {
    const characterNames = CHARACTER_TYPES.map((character) => character.name);
    this.totalCount = characterNames.length;

    characterNames.forEach((name) => {
      const soundFileName = this.getSoundFileName(name);
      const audio = new Audio(`/src/assets/sounds/${soundFileName}.mp3`);

      audio.addEventListener("canplaythrough", () => {
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      });

      audio.addEventListener("error", (e) => {
        console.warn(`Failed to load sound for ${name}:`, e);
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      });

      this.sounds.set(name, audio);
    });
  }

  playSound(characterName: string): void {
    const sound = this.sounds.get(characterName);
    if (sound) {
      // Reset the audio to the beginning and play
      sound.currentTime = 0;
      sound.play().catch((error) => {
        console.warn(`Failed to play sound for ${characterName}:`, error);
      });
    }
  }

  setOnLoadComplete(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  isLoaded(): boolean {
    return this.loadedCount === this.totalCount;
  }
}

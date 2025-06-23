import { Howl } from "howler";
import { CHARACTER_TYPES } from "../constants/GameConstants";

export class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private popSound: Howl | null = null;
  private loadedCount: number = 0;
  private totalCount: number = 0;
  private onLoadComplete?: () => void;
  private volume: number = 0.7; // Default volume

  constructor() {
    this.loadSounds();
  }

  private getSoundFileName(characterName: string): string {
    return characterName;
  }

  private loadSounds(): void {
    const characterNames = CHARACTER_TYPES.map((character) => character.name);
    this.totalCount = characterNames.length + 1; // +1 for pop sound

    characterNames.forEach((name) => {
      const soundFileName = this.getSoundFileName(name);
      const sound = new Howl({
        src: [`/src/assets/sounds/${soundFileName}.mp3`],
        preload: true,
        volume: this.volume,
        onload: () => {
          this.loadedCount++;
          if (this.loadedCount === this.totalCount) {
            this.onLoadComplete?.();
          }
        },
        onloaderror: (id, error) => {
          console.warn(`Failed to load sound for ${name}:`, error);
          this.loadedCount++;
          if (this.loadedCount === this.totalCount) {
            this.onLoadComplete?.();
          }
        },
      });
      this.sounds.set(name, sound);
    });

    // Load pop sound
    this.popSound = new Howl({
      src: ["/src/assets/sounds/pop.mp3"],
      preload: true,
      volume: this.volume,
      onload: () => {
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      },
      onloaderror: (id, error) => {
        console.warn("Failed to load pop sound:", error);
        this.loadedCount++;
        if (this.loadedCount === this.totalCount) {
          this.onLoadComplete?.();
        }
      },
    });
  }

  playSound(characterName: string): void {
    const sound = this.sounds.get(characterName);
    if (sound) {
      sound.play();
    }
  }

  playPop(): void {
    if (this.popSound) {
      this.popSound.play();
    }
  }

  stopSound(characterName: string): void {
    const sound = this.sounds.get(characterName);
    if (sound) {
      sound.stop();
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    // Update volume for all loaded sounds
    this.sounds.forEach((sound) => {
      sound.volume(this.volume);
    });
    if (this.popSound) {
      this.popSound.volume(this.volume);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  stopAllSounds(): void {
    this.sounds.forEach((sound) => {
      sound.stop();
    });
    if (this.popSound) {
      this.popSound.stop();
    }
  }

  setOnLoadComplete(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  isLoaded(): boolean {
    return this.loadedCount === this.totalCount;
  }
}

import { Howl } from "howler";
import { CHARACTER_TYPES } from "../constants/GameConstants";

export class SoundManager {
  private sounds = new Map<string, Howl>();
  private popSound: Howl | null = null;
  private loadedCount = 0;
  private totalCount = 0;
  private onLoadComplete?: () => void;
  private volume = 0.7; // Default volume

  constructor() {
    this.loadAllSounds();
  }

  // Load all character and pop sounds
  private loadAllSounds(): void {
    const characterNames = CHARACTER_TYPES.map((c) => c.name);
    this.totalCount = characterNames.length + 1; // +1 for pop

    // Load character sounds
    characterNames.forEach((name) => {
      this.sounds.set(name, this.createHowl(`/src/assets/sounds/${name}.mp3`, name));
    });

    // Load pop sound
    this.popSound = this.createHowl("/src/assets/sounds/pop.mp3", "pop");
  }

  // Helper to create a Howl instance with event handlers
  private createHowl(src: string, name: string): Howl {
    return new Howl({
      src: [src],
      preload: true,
      volume: this.volume,
      onload: () => this.handleLoad(),
      onloaderror: (_id, error) => this.handleLoadError(name, error),
    });
  }

  // Handle successful load
  private handleLoad(): void {
    this.loadedCount++;
    if (this.loadedCount === this.totalCount) {
      this.onLoadComplete?.();
    }
  }

  // Handle load error
  private handleLoadError(name: string, error: unknown): void {
    console.warn(`Failed to load sound for ${name}:`, error);
    this.handleLoad();
  }

  // Play a character's sound
  playSound(characterName: string): void {
    this.sounds.get(characterName)?.play();
  }

  // Play the pop sound
  playPop(): void {
    this.popSound?.play();
  }

  // Stop a character's sound
  stopSound(characterName: string): void {
    this.sounds.get(characterName)?.stop();
  }

  // Stop all sounds
  stopAllSounds(): void {
    this.sounds.forEach((sound) => sound.stop());
    this.popSound?.stop();
  }

  // Set volume for all sounds
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => sound.volume(this.volume));
    this.popSound?.volume(this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  // Set callback for when all sounds are loaded
  setOnLoadComplete(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  // Check if all sounds are loaded
  isLoaded(): boolean {
    return this.loadedCount === this.totalCount;
  }
}

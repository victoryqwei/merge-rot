import { Howl } from "howler";
import { clamp } from "lodash";
import { CharacterClass } from "../types/GameTypes";
import { GameMode } from "../constants/GameConstants";

export enum Sound {
  Pop = "pop",
  WaterPlop = "water-plop",
  BackgroundMusic = "background-music",
}

export class SoundManager {
  private sounds = new Map<string, Howl>();
  private loadedCount = 0;
  private totalCount = 0;
  private onLoadComplete?: () => void;
  private volume = 0.8; // Default volume
  private musicVolume = 0.2; // Lower volume for background music
  private characterDebounceTimer: number | null = null; // Global debounce timer
  private pendingCharacterSound: string | null = null; // Track highest tier character to play

  constructor() {
    this.loadAllSounds();
  }

  // Load all character, pop, and background music sounds
  private async loadAllSounds(): Promise<void> {
    // Get all sound names to load
    const characterNames = CharacterClass.getAllCharactersAllModes()
      .slice(1)
      .map((c: CharacterClass) => (c.mode === GameMode.ITALIAN_BRAINROT ? c.name : null))
      .filter((name): name is string => name !== null);
    const allSoundNames = [...characterNames, ...Object.values(Sound)];

    this.totalCount = allSoundNames.length;

    // Load all sounds
    for (const name of allSoundNames) {
      try {
        const soundModule = await import(`../assets/sounds/${name}.mp3`);

        // Special configuration for background music
        if (name === Sound.BackgroundMusic) {
          this.sounds.set(
            name,
            new Howl({
              src: [soundModule.default],
              preload: true,
              volume: this.musicVolume,
              loop: true,
              onload: () => this.handleLoad(),
              onloaderror: (_id, error) => this.handleLoadError(name, error),
            })
          );
        } else {
          // Regular configuration for other sounds
          this.sounds.set(name, this.createHowl(soundModule.default, name));
        }
      } catch (error) {
        console.warn(`Failed to load sound for ${name}:`, error);
        this.handleLoad();
      }
    }
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

  // Unified playSound method that handles all sound types
  play(soundName: Sound | string, volume = 1, pitch = 1): void {
    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound ${soundName} not found`);
      return;
    }

    sound.volume(volume);
    sound.rate(pitch);

    sound.play();
  }

  // Play a character's sound with global debouncing (prioritizes highest tier character)
  playSoundDebounced(characterName: string, debounceMs: number = 800): void {
    // Clear existing timer
    if (this.characterDebounceTimer) {
      clearTimeout(this.characterDebounceTimer);
    }

    // Check if this character is higher tier than the currently pending one
    const currentCharacterIndex = CharacterClass.getAllCharactersAllModes().findIndex((c) => c.name === characterName);
    const pendingCharacterIndex = this.pendingCharacterSound
      ? CharacterClass.getAllCharactersAllModes().findIndex((c) => c.name === this.pendingCharacterSound)
      : -1;

    // Only update if this character is higher tier (lower index = higher tier)
    if (pendingCharacterIndex === -1 || currentCharacterIndex >= pendingCharacterIndex) {
      this.pendingCharacterSound = characterName;
    }

    // Set new timer
    this.characterDebounceTimer = window.setTimeout(() => {
      if (this.pendingCharacterSound) {
        this.play(this.pendingCharacterSound);
        this.pendingCharacterSound = null;
      }
      this.characterDebounceTimer = null;
    }, debounceMs);
  }

  playBackgroundMusic(): void {
    this.play(Sound.BackgroundMusic);
  }

  // Pause background music (maintains position)
  pauseBackgroundMusic(): void {
    this.sounds.get(Sound.BackgroundMusic)?.pause();
  }

  // Resume background music (continues from where it was paused)
  resumeBackgroundMusic(): void {
    this.play(Sound.BackgroundMusic);
  }

  // Stop background music
  stopBackgroundMusic(): void {
    this.sounds.get(Sound.BackgroundMusic)?.stop();
  }

  // Stop a character's sound
  stopSound(characterName: string): void {
    this.sounds.get(characterName)?.stop();
  }

  // Stop all sounds
  stopAllSounds(): void {
    this.sounds.forEach((sound) => sound.stop());
  }

  // Set volume for all sounds
  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1);
    this.sounds.forEach((sound, name) => {
      // Don't change volume for background music (it has its own volume control)
      if (name !== Sound.BackgroundMusic) {
        sound.volume(this.volume);
      }
    });
  }

  // Set volume for background music
  setMusicVolume(volume: number): void {
    this.musicVolume = clamp(volume, 0, 1);
    this.sounds.get(Sound.BackgroundMusic)?.volume(this.musicVolume);
  }

  getVolume(): number {
    return this.volume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
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

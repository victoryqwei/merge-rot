import { Howl } from "howler";
import { clamp } from "lodash";
import { CharacterClass } from "../types/GameTypes";
import { GameMode } from "../constants/GameConstants";
import { SettingsManager } from "./SettingsManager";

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
  private sfxVolume: number;
  private musicVolume: number;
  private characterDebounceTimer: number | null = null; // Global debounce timer
  private pendingCharacterSound: string | null = null; // Track highest tier character to play
  private isBackgroundMusicPaused = false;

  constructor() {
    // Initialize with default values - will be updated when sounds are loaded
    const defaultSettings = SettingsManager.getSettings();
    this.sfxVolume = defaultSettings.sfxVolume;
    this.musicVolume = defaultSettings.musicVolume;

    this.loadAllSounds();
  }

  // Load all character, pop, and background music sounds
  private async loadAllSounds(): Promise<void> {
    // Get all sound names to load
    const data: ({ name: string; mode: GameMode } | string)[] = CharacterClass.getAllCharactersAllModes()
      .filter((c) => c.tier > 0 && c.hasSound)
      .map((c) => {
        return {
          name: c.name,
          mode: c.mode,
        };
      });

    data.push(...Object.values(Sound));

    this.totalCount = data.length;

    // Get current settings to apply to sounds
    const currentSettings = SettingsManager.getSettings();
    this.sfxVolume = currentSettings.sfxVolume;
    this.musicVolume = currentSettings.musicVolume;

    // Load all sounds
    for (const item of data) {
      try {
        let soundModule;
        if (typeof item === "string") {
          soundModule = await import(`../assets/sounds/${item}.mp3`);
        } else {
          soundModule = await import(`../assets/sounds/${item.mode}/${item.name}.mp3`);
        }

        // Special configuration for background music
        if (item === Sound.BackgroundMusic) {
          this.sounds.set(
            item,
            new Howl({
              src: [soundModule.default],
              preload: true,
              volume: this.musicVolume,
              loop: true,
              onload: () => this.handleLoad(),
              onloaderror: (_id, error) => this.handleLoadError(item, error),
            })
          );
        } else if (typeof item === "string") {
          // Regular configuration for other sounds
          this.sounds.set(item, this.createHowl(soundModule.default, item, this.sfxVolume));
        } else {
          // Regular configuration for other sounds
          this.sounds.set(item.name, this.createHowl(soundModule.default, item.name, this.sfxVolume));
        }
      } catch (error) {
        console.warn(`Failed to load sound for ${item}:`, error);
        this.handleLoad();
      }
    }
  }

  // Helper to create a Howl instance with event handlers
  private createHowl(src: string, name: string, volume: number): Howl {
    return new Howl({
      src: [src],
      preload: true,
      volume: volume,
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
    // Early exit if SFX volume is 0 and this isn't background music
    if (this.sfxVolume === 0 && soundName !== Sound.BackgroundMusic) {
      return;
    }

    const sound = this.sounds.get(soundName);
    if (!sound) {
      return;
    }

    // Use requestAnimationFrame to make audio operations non-blocking
    requestAnimationFrame(() => {
      try {
        // Only set volume/rate if they're different from current values
        // This avoids unnecessary audio context synchronization
        const currentVolume = sound.volume() as number;
        const currentRate = sound.rate() as number;

        if (Math.abs(currentVolume - volume) > 0.001) {
          sound.volume(volume);
        }

        if (Math.abs(currentRate - pitch) > 0.001) {
          sound.rate(pitch);
        }

        // Play the sound
        sound.play();
      } catch (error) {
        console.warn(`Error playing sound ${soundName}:`, error);
      }
    });
  }

  // Play a character's sound with global debouncing (prioritizes highest tier character)
  playSoundDebounced(characterName: string, debounceMs: number = 800): void {
    if (this.sfxVolume === 0) {
      return;
    }

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
        this.play(this.pendingCharacterSound, this.sfxVolume);
        this.pendingCharacterSound = null;
      }
      this.characterDebounceTimer = null;
    }, debounceMs);
  }

  playPop(soundName: Sound, pitch = 1): void {
    // SFX volume check is now handled in the play method
    this.play(soundName, this.sfxVolume, pitch);
  }

  // Fast playback for frequently used sounds (like WaterPlop)
  // Avoids parameter passing and uses cached volume
  playWaterPlop(): void {
    if (this.sfxVolume === 0) return;

    const sound = this.sounds.get(Sound.WaterPlop);
    if (!sound) return;

    // Use requestAnimationFrame for non-blocking playback
    requestAnimationFrame(() => {
      sound.play();
    });
  }

  playBackgroundMusic(): void {
    this.play(Sound.BackgroundMusic, this.musicVolume);
  }

  // Pause background music (maintains position)
  pauseBackgroundMusic(): void {
    this.sounds.get(Sound.BackgroundMusic)?.pause();
    this.isBackgroundMusicPaused = true;
  }

  // Resume background music (continues from where it was paused)
  resumeBackgroundMusic(): void {
    if (this.isBackgroundMusicPaused) {
      this.play(Sound.BackgroundMusic, this.musicVolume);
      this.isBackgroundMusicPaused = false;
    }
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

  // Set volume for SFX
  setSFXVolume(volume: number): void {
    this.sfxVolume = clamp(volume, 0, 1);
    this.sounds.forEach((sound, name) => {
      // Don't change volume for background music (it has its own volume control)
      if (name !== Sound.BackgroundMusic) {
        sound.volume(this.sfxVolume);
      }
    });

    // Save to localStorage
    SettingsManager.updateSettings({ sfxVolume: this.sfxVolume });
  }

  // Set volume for background music
  setMusicVolume(volume: number): void {
    this.musicVolume = clamp(volume, 0, 1);
    this.sounds.get(Sound.BackgroundMusic)?.volume(this.musicVolume);

    // Save to localStorage
    SettingsManager.updateSettings({ musicVolume: this.musicVolume });
  }

  getSFXVolume(): number {
    return this.sfxVolume;
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

  // Get loading progress as percentage (0-100)
  getLoadingProgress(): number {
    if (this.totalCount === 0) return 0;
    return (this.loadedCount / this.totalCount) * 100;
  }
}

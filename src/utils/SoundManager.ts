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
  private hasPlayedBackgroundMusic = false;
  private gameMode: GameMode;

  constructor(gameMode: GameMode) {
    // Initialize with default values - will be updated when sounds are loaded
    const defaultSettings = SettingsManager.getSettings();
    this.sfxVolume = defaultSettings.sfxVolume;
    this.musicVolume = defaultSettings.musicVolume;
    this.gameMode = gameMode;

    this.loadGameModeSounds();
  }

  mute(flag: boolean) {
    if (flag) {
      Howler.volume(0);
      return;
    } else {
      Howler.volume(this.musicVolume);
    }
  }

  // Load sound effects for the specific gamemode only (no background music)
  private async loadGameModeSounds(): Promise<void> {
    // Get character sounds for the specific gamemode only
    const characterSounds = CharacterClass.getAllCharacters(this.gameMode)
      .filter((c) => c.tier > 0 && c.hasSound)
      .map((c) => ({
        name: c.name,
        mode: c.mode,
      }));

    // Add generic sound effects
    const genericSounds = [Sound.Pop, Sound.WaterPlop, Sound.BackgroundMusic];

    const allSounds = [...characterSounds, ...genericSounds];
    this.totalCount = allSounds.length;

    // Get current settings to apply to sounds
    const currentSettings = SettingsManager.getSettings();
    this.sfxVolume = currentSettings.sfxVolume;
    this.musicVolume = currentSettings.musicVolume;

    // Load all sounds
    for (const item of allSounds) {
      try {
        // check if sound is already loaded
        if ((typeof item === "string" && this.sounds.has(item)) || (typeof item !== "string" && this.sounds.has(item.name))) {
          this.loadedCount++;
          continue;
        }

        let soundModule;
        if (typeof item === "string") {
          soundModule = await import(`../assets/sounds/${item}.mp3`);
          this.sounds.set(item, this.createHowl(soundModule.default, item, this.sfxVolume));
        } else {
          soundModule = await import(`../assets/sounds/${item.mode}/${item.name}.mp3`);
          this.sounds.set(item.name, this.createHowl(soundModule.default, item.name, this.sfxVolume));
        }
      } catch (error) {
        console.warn(`Failed to load sound for ${item}:`, error);
        this.handleLoad();
      }
    }
  }

  // Method to switch to a new gamemode (clears existing sounds and loads new ones)
  async switchGameMode(newGameMode: GameMode): Promise<void> {
    this.gameMode = newGameMode;

    // Stop and dispose of existing sounds (except background music if loaded)
    for (const [key, sound] of this.sounds.entries()) {
      if (key !== Sound.BackgroundMusic) {
        sound.stop();
        sound.unload();
      }
    }

    // Clear non-background music sounds
    for (const key of this.sounds.keys()) {
      if (key !== Sound.BackgroundMusic) {
        this.sounds.delete(key);
      }
    }

    this.loadedCount = 0;
    this.totalCount = 0;
    await this.loadGameModeSounds();
  }

  // Helper to create a Howl instance with event handlers
  private createHowl(src: string, name: string, volume: number): Howl {
    const isBackgroundMusic = name === Sound.BackgroundMusic;

    return new Howl({
      src: [src],
      preload: true,
      volume: volume,
      loop: isBackgroundMusic,
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
    sound.play();
  }

  playBackgroundMusic(): void {
    if (!this.hasPlayedBackgroundMusic) {
      this.play(Sound.BackgroundMusic, this.musicVolume);
      this.hasPlayedBackgroundMusic = true;
    }
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
    // Background music is not loaded, so we only save the setting

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
    // if (this.totalCount === 0) return 0;
    // return (this.loadedCount / this.totalCount) * 100;
    return 100;
  }
}

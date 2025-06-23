import { Howl } from "howler";
import { CharacterClass } from "../types/GameTypes";

export class SoundManager {
  private sounds = new Map<string, Howl>();
  private popSound: Howl | null = null;
  private backgroundMusic: Howl | null = null;
  private loadedCount = 0;
  private totalCount = 0;
  private onLoadComplete?: () => void;
  private volume = 1; // Default volume
  private musicVolume = 0.2; // Lower volume for background music
  private characterDebounceTimer: number | null = null; // Global debounce timer
  private pendingCharacterSound: string | null = null; // Track highest tier character to play

  constructor() {
    this.loadAllSounds();
  }

  // Load all character, pop, and background music sounds
  private loadAllSounds(): void {
    const characterNames = CharacterClass.getAllCharacters().map((c) => c.name);
    this.totalCount = characterNames.length + 2; // +1 for pop, +1 for background music

    // Load character sounds
    characterNames.forEach((name) => {
      this.sounds.set(name, this.createHowl(`/src/assets/sounds/${name}.mp3`, name));
    });

    // Load pop sound
    this.popSound = this.createHowl("/src/assets/sounds/pop.mp3", "pop");

    // Load background music
    this.backgroundMusic = new Howl({
      src: ["/src/assets/sounds/background-music.mp3"],
      preload: true,
      volume: this.musicVolume,
      loop: true, // Loop the background music
      onload: () => this.handleLoad(),
      onloaderror: (_id, error) => this.handleLoadError("background-music", error),
    });
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

  // Play a character's sound with global debouncing (prioritizes highest tier character)
  playSoundDebounced(characterName: string, debounceMs: number = 800): void {
    // Clear existing timer
    if (this.characterDebounceTimer) {
      clearTimeout(this.characterDebounceTimer);
    }

    // Check if this character is higher tier than the currently pending one
    const currentCharacterIndex = CharacterClass.getAllCharacters().findIndex((c) => c.name === characterName);
    const pendingCharacterIndex = this.pendingCharacterSound
      ? CharacterClass.getAllCharacters().findIndex((c) => c.name === this.pendingCharacterSound)
      : -1;

    // Only update if this character is higher tier (lower index = higher tier)
    if (pendingCharacterIndex === -1 || currentCharacterIndex >= pendingCharacterIndex) {
      this.pendingCharacterSound = characterName;
    }

    // Set new timer
    this.characterDebounceTimer = window.setTimeout(() => {
      if (this.pendingCharacterSound) {
        this.playSound(this.pendingCharacterSound);
        this.pendingCharacterSound = null;
      }
      this.characterDebounceTimer = null;
    }, debounceMs);
  }

  // Play the pop sound
  playPop(): void {
    this.popSound?.play();
  }

  // Play background music
  playBackgroundMusic(): void {
    this.backgroundMusic?.play();
  }

  // Pause background music (maintains position)
  pauseBackgroundMusic(): void {
    this.backgroundMusic?.pause();
  }

  // Resume background music (continues from where it was paused)
  resumeBackgroundMusic(): void {
    this.backgroundMusic?.play();
  }

  // Stop background music
  stopBackgroundMusic(): void {
    this.backgroundMusic?.stop();
  }

  // Stop a character's sound
  stopSound(characterName: string): void {
    this.sounds.get(characterName)?.stop();
  }

  // Stop all sounds
  stopAllSounds(): void {
    this.sounds.forEach((sound) => sound.stop());
    this.popSound?.stop();
    this.backgroundMusic?.stop();
  }

  // Set volume for all sounds
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => sound.volume(this.volume));
    this.popSound?.volume(this.volume);
  }

  // Set volume for background music
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.backgroundMusic?.volume(this.musicVolume);
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

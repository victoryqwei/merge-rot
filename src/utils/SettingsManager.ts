import { GameMode } from "../constants/GameConstants";

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  lastPlayedGameMode: GameMode;
  gameBoxScale: number;
}

export class SettingsManager {
  private static readonly STORAGE_KEY = "suika-game-settings";
  private static readonly DEFAULT_SETTINGS: GameSettings = {
    sfxVolume: 0.8,
    musicVolume: 0.5,
    lastPlayedGameMode: GameMode.ITALIAN_BRAINROT,
    gameBoxScale: 1.0,
  };

  static getSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the parsed settings
        if (this.isValidSettings(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load settings from localStorage:", error);
    }

    // Return default settings if nothing is stored or invalid
    return { ...this.DEFAULT_SETTINGS };
  }

  static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save settings to localStorage:", error);
    }
  }

  static updateSettings(updates: Partial<GameSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    this.saveSettings(newSettings);
  }

  private static isValidSettings(settings: unknown): settings is GameSettings {
    return (
      typeof settings === "object" &&
      settings !== null &&
      typeof (settings as GameSettings).sfxVolume === "number" &&
      (settings as GameSettings).sfxVolume >= 0 &&
      (settings as GameSettings).sfxVolume <= 1 &&
      typeof (settings as GameSettings).musicVolume === "number" &&
      (settings as GameSettings).musicVolume >= 0 &&
      (settings as GameSettings).musicVolume <= 1 &&
      Object.values(GameMode).includes((settings as GameSettings).lastPlayedGameMode) &&
      typeof (settings as GameSettings).gameBoxScale === "number" &&
      (settings as GameSettings).gameBoxScale >= 0.5 &&
      (settings as GameSettings).gameBoxScale <= 1.5
    );
  }
}

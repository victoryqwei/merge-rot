# Game Mode System Documentation

## Overview

The game has been updated to support multiple game modes with different character classes. Each game mode has its own set of characters that can be combined and evolved independently.

## Changes Made

### 1. CharacterClass Updates (`src/types/GameTypes.ts`)

- **New Methods:**

  - `getAllCharacters(mode: GameMode)`: Returns characters for a specific game mode
  - `getByName(name: string, mode: GameMode)`: Finds a character by name within a game mode
  - `getRandom(mode: GameMode, maxTier: number)`: Gets a random character for a specific game mode

- **Backward Compatibility Methods:**
  - `getAllCharactersAllModes()`: Returns all characters from all game modes
  - `getByNameAllModes(name: string)`: Finds a character by name from all game modes
  - `getRandomAllModes(maxTier: number)`: Gets a random character from all game modes

### 2. CharacterManager Updates (`src/game/CharacterManager.ts`)

- Added `gameMode` property to track the current game mode
- Updated constructor to accept a `GameMode` parameter
- Added `setGameMode()` and `getGameMode()` methods
- Updated `generateRandomCharacter()` to use the current game mode

### 3. SuikaGame Updates (`src/game/SuikaGame.ts`)

- Updated constructor to accept a `GameMode` parameter (defaults to `ITALIAN_BRAINROT`)
- Added `setGameMode()` and `getGameMode()` methods
- Game mode changes automatically regenerate appropriate characters

### 4. GameStateManager Updates (`src/game/managers/GameStateManager.ts`)

- Added `clearCharacters()` method to reset current/next characters when game mode changes

## Available Game Modes

### 1. Italian Brainrot (`GameMode.ITALIAN_BRAINROT`)

Characters include:

- Trippi Troppi (shrimp-cat)
- Capuccino Assassino (capuccino)
- Burbaloni Lulilolli (capybara-coconut)
- Chimpanzini Bananini (monkey-banana)
- Boneca Ambalabu (frog-tire)
- Frigo Camelo (camel-fridge)
- Lirili Larila (elephant)
- La Vaca Saturno Saturnita (cow)
- Tung Tung Tung Sahur (baseball-bat)
- Tralalero Tralala (shark)
- Bombardino Crocodilo (crocodile)
- Brr Brr Patapim (big-feet)

### 2. Cats (`GameMode.CATS`)

Characters include:

- Paw
- Cat 1 through Cat 9

## Usage Examples

### Basic Usage

```typescript
import { SuikaGame } from "./game/SuikaGame";
import { GameMode } from "./constants/GameConstants";

// Create game with default mode (Italian Brainrot)
const game = new SuikaGame(canvas);

// Create game with specific mode
const catsGame = new SuikaGame(canvas, GameMode.CATS);
```

### Changing Game Mode During Runtime

```typescript
// Switch to Cats mode
game.setGameMode(GameMode.CATS);

// Switch back to Italian Brainrot mode
game.setGameMode(GameMode.ITALIAN_BRAINROT);
```

### Getting Current Game Mode

```typescript
const currentMode = game.getGameMode();
console.log(`Current game mode: ${currentMode}`);
```

### Character Generation by Game Mode

```typescript
import { CharacterClass } from "./types/GameTypes";

// Get all characters for a specific game mode
const italianCharacters = CharacterClass.getAllCharacters(GameMode.ITALIAN_BRAINROT);
const catCharacters = CharacterClass.getAllCharacters(GameMode.CATS);

// Get a random character for a specific game mode
const randomItalian = CharacterClass.getRandom(GameMode.ITALIAN_BRAINROT, 4);
const randomCat = CharacterClass.getRandom(GameMode.CATS, 4);

// Find a character by name within a game mode
const capuccino = CharacterClass.getByName("capuccino", GameMode.ITALIAN_BRAINROT);
const cat1 = CharacterClass.getByName("cat1", GameMode.CATS);
```

## Example Component

See `src/examples/GameModeExample.tsx` for a complete example of how to use the game mode system with a React component that allows switching between game modes.

## Adding New Game Modes

To add a new game mode:

1. **Add the game mode to the enum:**

   ```typescript
   // In src/constants/GameConstants.ts
   export enum GameMode {
     ITALIAN_BRAINROT = "Italian Brainrot",
     CATS = "Cats",
     NEW_MODE = "New Mode", // Add your new mode
   }
   ```

2. **Create a character class for the new mode:**

   ```typescript
   // In src/types/CharacterClassRegistry.ts
   export class NewModeCharacterClass extends CharacterClass {
     constructor(name: string, radius: number, displayName: string, tier: number) {
       super(GameMode.NEW_MODE, name, radius, displayName, tier);
     }
   }
   ```

3. **Add characters to the getAllCharacters method:**
   ```typescript
   // In src/types/GameTypes.ts, update getAllCharacters method
   case GameMode.NEW_MODE:
     return [
       new NewModeCharacterClass("char1", 25, "Character 1", 0),
       new NewModeCharacterClass("char2", 30, "Character 2", 1),
       // ... more characters
     ];
   ```

## Backward Compatibility

All existing code should continue to work without changes. The backward compatibility methods ensure that any code using the old API will still function correctly, but it's recommended to update to the new game mode-specific methods for better organization and performance.

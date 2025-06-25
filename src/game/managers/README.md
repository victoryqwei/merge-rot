# Game Managers

This directory contains the modular managers that handle different aspects of the Suika game. The refactoring breaks down the monolithic `SuikaGame` class into focused, single-responsibility classes.

## Architecture Overview

The game is now organized into several managers, each handling a specific concern:

### Core Managers

- **InputManager** - Handles mouse/touch input and device detection
- **ShakeManager** - Manages screen shake effects and animations
- **AnimationManager** - Handles character animations and timing
- **GameStateManager** - Manages game state (score, characters, game over)
- **GameLoop** - Handles the main game loop and frame timing

### Main Game Class

- **SuikaGameRefactored** - Orchestrates all managers and provides the public API

## Benefits of This Architecture

1. **Single Responsibility Principle** - Each manager has one clear purpose
2. **Easier Testing** - Managers can be tested in isolation
3. **Better Maintainability** - Changes to one aspect don't affect others
4. **Improved Readability** - Smaller, focused classes are easier to understand
5. **Reusability** - Managers can be reused in other game contexts

## Usage

### Basic Setup

```typescript
import { SuikaGameRefactored } from "./SuikaGameRefactored";

const game = new SuikaGameRefactored(canvas);
```

### Individual Managers

```typescript
import { InputManager, ShakeManager, AnimationManager } from "./managers";

const inputManager = new InputManager();
const shakeManager = new ShakeManager();
const animationManager = new AnimationManager();
```

## Manager Details

### InputManager

Handles all input-related functionality:

- Mouse and touch event processing
- Device detection (mobile vs desktop)
- Input state management
- Drop callback handling

### ShakeManager

Manages screen shake effects:

- Shake intensity and duration
- Lift animation (up/hold/down phases)
- Physics integration via callbacks
- Smooth oscillation calculations

### AnimationManager

Handles timing and animations:

- Character drop cooldowns
- Character animation progress
- Drop readiness checks
- Animation state management

### GameStateManager

Manages core game state:

- Score tracking
- Character generation
- Game over detection
- Game state transitions

### GameLoop

Handles the main game loop:

- Frame timing and delta time calculation
- Update and draw cycle management
- Performance optimization
- Loop start/stop control

## Migration from Original SuikaGame

The refactored version maintains the same public API as the original `SuikaGame` class, so existing React components should work without changes. The main differences are:

1. Better separation of concerns
2. More testable code structure
3. Easier to extend and modify
4. Clearer responsibility boundaries

## Future Enhancements

This modular structure makes it easy to add new features:

- **AudioManager** - For more sophisticated audio handling
- **ParticleManager** - For particle system management
- **UIManager** - For UI state management
- **SaveManager** - For game save/load functionality

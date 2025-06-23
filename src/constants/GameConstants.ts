import { CharacterClass } from "../types/GameTypes";

// Export the character types using the new class system
export const CHARACTER_TYPES = CharacterClass.getAllCharacters();

export const PHYSICS = {
  GRAVITY: 0.5,
  BOUNCE: 0.7,
  FRICTION: 0.98,
  MIN_VELOCITY: 0.5,
};

export const GAME_CONFIG = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 500,
  GAME_OVER_HEIGHT: 100,
  PARTICLE_COUNT: 8,
  PARTICLE_LIFE: 30,
  PARTICLE_SPEED: 10,
  DROP_COOLDOWN_TIME: 0, // 600ms cooldown between drops
};

import type { CharacterType } from "../types/GameTypes";

export const CHARACTER_TYPES: CharacterType[] = [
  { name: "shrimp-cat", radius: 15, points: 1 },
  { name: "cappuccino", radius: 20, points: 2 },
  { name: "capybara-coconut", radius: 25, points: 3 },
  { name: "monkey-banana", radius: 30, points: 4 },
  { name: "frog-tire", radius: 35, points: 5 },
  { name: "camel-fridge", radius: 40, points: 6 },
  { name: "elephant", radius: 45, points: 7 },
  { name: "cow", radius: 50, points: 8 },
  { name: "baseball-bat", radius: 55, points: 9 },
  { name: "shark", radius: 60, points: 10 },
  { name: "crocodile", radius: 65, points: 11 },
  { name: "big-feet", radius: 70, points: 12 },
];

export const PHYSICS = {
  GRAVITY: 0.5,
  BOUNCE: 0.7,
  FRICTION: 0.98,
  MIN_VELOCITY: 0.5,
};

export const GAME_CONFIG = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  GAME_OVER_HEIGHT: 100,
  PARTICLE_COUNT: 8,
  PARTICLE_LIFE: 30,
  PARTICLE_SPEED: 10,
};

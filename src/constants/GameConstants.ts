import type { CharacterType } from "../types/GameTypes";

export const CHARACTER_TYPES: CharacterType[] = [
  { name: "shrimp-cat", radius: 15, points: 1, displayName: "Trippi Troppi" },
  { name: "cappuccino", radius: 20, points: 2, displayName: "Capuccino Assassino" },
  { name: "capybara-coconut", radius: 25, points: 3, displayName: "Burbaloni Lulilolli" },
  { name: "monkey-banana", radius: 30, points: 4, displayName: "Chimpanzini Bananini" },
  { name: "frog-tire", radius: 35, points: 5, displayName: "Boneca Ambalabu" },
  { name: "camel-fridge", radius: 40, points: 6, displayName: "Frigo Camelo" },
  { name: "elephant", radius: 45, points: 7, displayName: "Lirili Larila" },
  { name: "cow", radius: 50, points: 8, displayName: "La Vaca Saturno Saturnita" },
  { name: "baseball-bat", radius: 55, points: 9, displayName: "Tung Tung Tung Sahur" },
  { name: "shark", radius: 60, points: 10, displayName: "Tralalero Tralala" },
  { name: "crocodile", radius: 65, points: 11, displayName: "Bombardiro Crocodilo" },
  { name: "big-feet", radius: 70, points: 12, displayName: "Brr Brr Patapim" },
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

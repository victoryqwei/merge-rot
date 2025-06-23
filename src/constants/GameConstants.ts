import type { CharacterType } from "../types/GameTypes";

export const CHARACTER_TYPES: CharacterType[] = [
  { emoji: "🍒", radius: 15, color: "#ff6b6b", points: 1 },
  { emoji: "🍓", radius: 20, color: "#ff8e8e", points: 2 },
  { emoji: "🍇", radius: 25, color: "#a855f7", points: 3 },
  { emoji: "🍊", radius: 30, color: "#ffa726", points: 4 },
  { emoji: "🍎", radius: 35, color: "#ef5350", points: 5 },
  { emoji: "🍐", radius: 40, color: "#66bb6a", points: 6 },
  { emoji: "🍑", radius: 45, color: "#ffb3ba", points: 7 },
  { emoji: "🍍", radius: 50, color: "#ffd54f", points: 8 },
  { emoji: "🍈", radius: 55, color: "#81c784", points: 9 },
  { emoji: "🍉", radius: 60, color: "#4caf50", points: 10 },
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

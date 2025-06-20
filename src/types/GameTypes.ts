import type { Body, Engine, World, Render } from "matter-js";

export interface FruitType {
  emoji: string;
  radius: number;
  color: string;
  points: number;
}

export interface Fruit extends FruitType {
  body: Body;
  type: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface GameState {
  score: number;
  fruits: Fruit[];
  currentFruit: Fruit | null;
  nextFruit: FruitType | null;
  gameOver: boolean;
  particles: Particle[];
}

export interface PhysicsWorld {
  engine: Engine;
  world: World;
  render: Render;
}

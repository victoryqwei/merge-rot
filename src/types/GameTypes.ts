import type { Body, Engine, World, Render } from "matter-js";

export interface CharacterType {
  emoji: string;
  radius: number;
  color: string;
  points: number;
}

export interface Character extends CharacterType {
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
  characters: Character[];
  currentCharacter: Character | null;
  nextCharacter: CharacterType | null;
  gameOver: boolean;
  particles: Particle[];
}

export interface PhysicsWorld {
  engine: Engine;
  world: World;
  render: Render;
}

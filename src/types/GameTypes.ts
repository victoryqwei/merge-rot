export interface FruitType {
  emoji: string;
  radius: number;
  color: string;
  points: number;
}

export interface Fruit extends FruitType {
  x: number;
  y: number;
  vx: number;
  vy: number;
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

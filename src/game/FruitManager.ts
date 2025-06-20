import type { Fruit, FruitType, Particle } from "../types/GameTypes";
import { FRUIT_TYPES, GAME_CONFIG } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";

export class FruitManager {
  private fruits: Fruit[] = [];
  private particles: Particle[] = [];
  private physicsEngine: PhysicsEngine;

  constructor(physicsEngine: PhysicsEngine) {
    this.physicsEngine = physicsEngine;
  }

  generateRandomFruit(): FruitType {
    const randomIndex = Math.floor(Math.random() * 3); // Start with smaller fruits
    return FRUIT_TYPES[randomIndex];
  }

  createFruit(fruitType: FruitType, x: number, y: number): Fruit {
    const body = this.physicsEngine.createFruitBody(fruitType.radius, x, y);

    return {
      ...fruitType,
      body,
      type: FRUIT_TYPES.indexOf(fruitType),
    };
  }

  addFruit(fruit: Fruit): void {
    this.fruits.push(fruit);
  }

  getFruits(): Fruit[] {
    return this.fruits;
  }

  updateFruits(): void {
    this.physicsEngine.update();
  }

  checkCombinations(): number {
    let scoreIncrease = 0;

    for (let i = 0; i < this.fruits.length; i++) {
      for (let j = i + 1; j < this.fruits.length; j++) {
        const fruit1 = this.fruits[i];
        const fruit2 = this.fruits[j];

        if (fruit1.type === fruit2.type && fruit1.type < FRUIT_TYPES.length - 1) {
          if (this.physicsEngine.checkCollision(fruit1, fruit2)) {
            // Combine fruits
            const newType = fruit1.type + 1;
            const pos1 = this.physicsEngine.getBodyPosition(fruit1.body);
            const pos2 = this.physicsEngine.getBodyPosition(fruit2.body);
            const vel1 = this.physicsEngine.getBodyVelocity(fruit1.body);
            const vel2 = this.physicsEngine.getBodyVelocity(fruit2.body);

            const newFruit = this.createFruit(FRUIT_TYPES[newType], (pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);

            // Set velocity
            newFruit.body.velocity.x = (vel1.x + vel2.x) / 2;
            newFruit.body.velocity.y = (vel1.y + vel2.y) / 2;

            // Remove old fruits
            this.physicsEngine.removeBody(fruit1.body);
            this.physicsEngine.removeBody(fruit2.body);
            this.fruits.splice(j, 1);
            this.fruits.splice(i, 1);

            // Add new fruit
            this.fruits.push(newFruit);

            // Add score
            scoreIncrease += FRUIT_TYPES[newType].points * 10;

            // Add explosion effect
            this.createExplosion(newFruit.body.position.x, newFruit.body.position.y);

            return scoreIncrease; // Exit to avoid index issues
          }
        }
      }
    }

    return scoreIncrease;
  }

  private createExplosion(x: number, y: number): void {
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
      const particle: Particle = {
        x,
        y,
        vx: (Math.random() - 0.5) * GAME_CONFIG.PARTICLE_SPEED,
        vy: (Math.random() - 0.5) * GAME_CONFIG.PARTICLE_SPEED,
        life: GAME_CONFIG.PARTICLE_LIFE,
      };
      this.particles.push(particle);
    }
  }

  updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  checkGameOver(): boolean {
    return this.physicsEngine.checkGameOver();
  }

  clear(): void {
    this.physicsEngine.clear();
    this.fruits = [];
    this.particles = [];
  }
}

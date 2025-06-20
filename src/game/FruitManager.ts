import type { Fruit, FruitType, Particle } from "../types/GameTypes";
import { FRUIT_TYPES, GAME_CONFIG } from "../constants/GameConstants";
import { PhysicsEngine } from "../utils/PhysicsEngine";

export class FruitManager {
  private fruits: Fruit[] = [];
  private particles: Particle[] = [];

  generateRandomFruit(): FruitType {
    const randomIndex = Math.floor(Math.random() * 3); // Start with smaller fruits
    return FRUIT_TYPES[randomIndex];
  }

  createFruit(fruitType: FruitType, x: number, y: number): Fruit {
    return {
      ...fruitType,
      x,
      y,
      vx: 0,
      vy: 0,
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
    for (const fruit of this.fruits) {
      PhysicsEngine.updateFruitPhysics(fruit);
    }
  }

  checkCombinations(): number {
    let scoreIncrease = 0;

    for (let i = 0; i < this.fruits.length; i++) {
      for (let j = i + 1; j < this.fruits.length; j++) {
        const fruit1 = this.fruits[i];
        const fruit2 = this.fruits[j];

        if (fruit1.type === fruit2.type && fruit1.type < FRUIT_TYPES.length - 1) {
          if (PhysicsEngine.checkCollision(fruit1, fruit2)) {
            // Combine fruits
            const newType = fruit1.type + 1;
            const newFruit = this.createFruit(FRUIT_TYPES[newType], (fruit1.x + fruit2.x) / 2, (fruit1.y + fruit2.y) / 2);
            newFruit.vx = (fruit1.vx + fruit2.vx) / 2;
            newFruit.vy = (fruit1.vy + fruit2.vy) / 2;

            // Remove old fruits and add new one
            this.fruits.splice(j, 1);
            this.fruits.splice(i, 1);
            this.fruits.push(newFruit);

            // Add score
            scoreIncrease += FRUIT_TYPES[newType].points * 10;

            // Add explosion effect
            this.createExplosion(newFruit.x, newFruit.y);

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
    for (const fruit of this.fruits) {
      if (fruit.y - fruit.radius < GAME_CONFIG.GAME_OVER_HEIGHT) {
        return true;
      }
    }
    return false;
  }

  clear(): void {
    this.fruits = [];
    this.particles = [];
  }
}

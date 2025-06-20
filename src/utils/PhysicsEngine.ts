import type { Fruit } from "../types/GameTypes";
import { PHYSICS, GAME_CONFIG } from "../constants/GameConstants";

export class PhysicsEngine {
  static updateFruitPhysics(fruit: Fruit): void {
    // Apply gravity
    fruit.vy += PHYSICS.GRAVITY;

    // Update position
    fruit.x += fruit.vx;
    fruit.y += fruit.vy;

    // Apply friction
    fruit.vx *= PHYSICS.FRICTION;

    // Wall collisions
    if (fruit.x - fruit.radius < 0) {
      fruit.x = fruit.radius;
      fruit.vx *= -PHYSICS.BOUNCE;
    }
    if (fruit.x + fruit.radius > GAME_CONFIG.CANVAS_WIDTH) {
      fruit.x = GAME_CONFIG.CANVAS_WIDTH - fruit.radius;
      fruit.vx *= -PHYSICS.BOUNCE;
    }

    // Floor collision
    if (fruit.y + fruit.radius > GAME_CONFIG.CANVAS_HEIGHT) {
      fruit.y = GAME_CONFIG.CANVAS_HEIGHT - fruit.radius;
      fruit.vy *= -PHYSICS.BOUNCE;

      // Stop small movements
      if (Math.abs(fruit.vy) < PHYSICS.MIN_VELOCITY) {
        fruit.vy = 0;
      }
    }
  }

  static checkCollision(fruit1: Fruit, fruit2: Fruit): boolean {
    const distance = Math.sqrt(Math.pow(fruit1.x - fruit2.x, 2) + Math.pow(fruit1.y - fruit2.y, 2));
    return distance < fruit1.radius + fruit2.radius;
  }

  static calculateDistance(fruit1: Fruit, fruit2: Fruit): number {
    return Math.sqrt(Math.pow(fruit1.x - fruit2.x, 2) + Math.pow(fruit1.y - fruit2.y, 2));
  }
}

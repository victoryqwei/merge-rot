import * as Matter from "matter-js";
import type { Fruit } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Matter.Body[] = [];

  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Set up world properties
    this.world.gravity.y = 0.5;

    // Create boundaries
    this.createBoundaries();
  }

  private createBoundaries(): void {
    const thickness = 20;

    // Left wall
    const leftWall = Matter.Bodies.rectangle(-thickness / 2, GAME_CONFIG.CANVAS_HEIGHT / 2, thickness, GAME_CONFIG.CANVAS_HEIGHT, {
      isStatic: true,
    });

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      GAME_CONFIG.CANVAS_WIDTH + thickness / 2,
      GAME_CONFIG.CANVAS_HEIGHT / 2,
      thickness,
      GAME_CONFIG.CANVAS_HEIGHT,
      { isStatic: true }
    );

    // Floor
    const floor = Matter.Bodies.rectangle(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.CANVAS_HEIGHT + thickness / 2,
      GAME_CONFIG.CANVAS_WIDTH,
      thickness,
      { isStatic: true }
    );

    Matter.World.add(this.world, [leftWall, rightWall, floor]);
  }

  createFruitBody(radius: number, x: number, y: number): Matter.Body {
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.7,
      friction: 0.8,
      density: 0.001,
    });

    this.bodies.push(body);
    Matter.World.add(this.world, body);

    return body;
  }

  update(): void {
    Matter.Engine.update(this.engine, 1000 / 60);
  }

  getBodyPosition(body: Matter.Body): { x: number; y: number } {
    return {
      x: body.position.x,
      y: body.position.y,
    };
  }

  getBodyVelocity(body: Matter.Body): { x: number; y: number } {
    return {
      x: body.velocity.x,
      y: body.velocity.y,
    };
  }

  checkCollision(fruit1: Fruit, fruit2: Fruit): boolean {
    const pairs = this.engine.pairs.list;

    for (const pair of pairs) {
      if ((pair.bodyA === fruit1.body && pair.bodyB === fruit2.body) || (pair.bodyA === fruit2.body && pair.bodyB === fruit1.body)) {
        return true;
      }
    }

    return false;
  }

  removeBody(body: Matter.Body): void {
    Matter.World.remove(this.world, body);
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
  }

  getWorld(): Matter.World {
    return this.world;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  checkGameOver(): boolean {
    for (const body of this.bodies) {
      if (body.position.y - body.circleRadius! < GAME_CONFIG.GAME_OVER_HEIGHT) {
        return true;
      }
    }
    return false;
  }

  clear(): void {
    for (const body of this.bodies) {
      Matter.World.remove(this.world, body);
    }
    this.bodies = [];
  }
}

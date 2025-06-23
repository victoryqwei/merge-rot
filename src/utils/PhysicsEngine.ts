import * as Matter from "matter-js";
import type { Character } from "../types/GameTypes";
import { GAME_CONFIG } from "../constants/GameConstants";
import { ShapeDetector } from "./ShapeDetector";

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Matter.Body[] = [];
  private gameOverTimer: number = 0;
  private gameOverDelay: number = 120; // 2 seconds at 60fps
  private collisionDetector: Matter.Detector;

  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Set up world properties
    this.world.gravity.y = 0.5;

    // Create collision detector
    this.collisionDetector = Matter.Detector.create({
      bodies: [],
    });

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

  createCharacterBody(radius: number, x: number, y: number): Matter.Body {
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.7,
      friction: 0.8,
      density: 0.001,
    });

    this.bodies.push(body);
    Matter.World.add(this.world, body);

    // Add body to collision detector
    this.collisionDetector.bodies.push(body);

    return body;
  }

  async createCharacterBodyFromImage(image: HTMLImageElement, radius: number, x: number, y: number): Promise<Matter.Body> {
    const body = await ShapeDetector.createCharacterBodyFromImage(image, x, y, radius);

    this.bodies.push(body);
    Matter.World.add(this.world, body);

    // Add body to collision detector
    this.collisionDetector.bodies.push(body);

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

  getBodyRotation(body: Matter.Body): number {
    return body.angle;
  }

  checkCollision(character1: Character, character2: Character): boolean {
    // Use Matter.js collision detection
    const pairs = Matter.Detector.collisions(this.collisionDetector);

    // Check if the two characters are colliding
    for (const pair of pairs) {
      if (
        (pair.bodyA.id === character1.body.id && pair.bodyB.id === character2.body.id) ||
        (pair.bodyA.id === character2.body.id && pair.bodyB.id === character1.body.id)
      ) {
        return true;
      }
    }

    return false;
  }

  removeBody(body: Matter.Body): void {
    Matter.World.remove(this.world, body);

    // Remove from collision detector
    const detectorIndex = this.collisionDetector.bodies.indexOf(body);
    if (detectorIndex > -1) {
      this.collisionDetector.bodies.splice(detectorIndex, 1);
    }

    // Remove from bodies array
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
    // Check if any character is too high
    const characterAboveLine = this.bodies.some((body) => body.position.y - body.circleRadius! < GAME_CONFIG.GAME_OVER_HEIGHT);

    if (characterAboveLine) {
      // Only trigger game over if all characters have stopped moving AND timer has elapsed
      if (this.allCharactersStopped()) {
        this.gameOverTimer++;
        if (this.gameOverTimer >= this.gameOverDelay) {
          return true;
        }
      } else {
        // Reset timer if characters are still moving
        this.gameOverTimer = 0;
      }
    } else {
      // Reset timer if no characters are above the line
      this.gameOverTimer = 0;
    }

    return false;
  }

  private allCharactersStopped(): boolean {
    const velocityThreshold = 0.5; // Minimum velocity to consider "stopped"

    for (const body of this.bodies) {
      const velocity = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
      if (velocity > velocityThreshold) {
        return false; // At least one character is still moving
      }
    }
    return true; // All characters have stopped moving
  }

  clear(): void {
    for (const body of this.bodies) {
      Matter.World.remove(this.world, body);
    }
    this.bodies = [];
    this.collisionDetector.bodies = [];
    this.gameOverTimer = 0;
  }
}
